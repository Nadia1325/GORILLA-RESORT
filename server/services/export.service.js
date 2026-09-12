import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import { getKigaliDateString } from "../utils.js";
import { appendAudit } from "./audit.service.js";
import { readAllAdminData } from "./dashboard.service.js";
import { httpError } from "../httpError.js";

function activityDate(value) {
  if (!value) return "";
  return getKigaliDateString(new Date(value));
}

function activityTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-US", {
    timeZone: "Africa/Kigali",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function resolvePeriod({ period, selectedDate, selectedMonth, selectedYear }) {
  const dateFromKigali = (value) => new Date(`${value}T00:00:00+02:00`);

  if (period === "weekly") {
    // The selected date identifies the week. The report always runs Monday-Sunday.
    const [year, month, dayOfMonth] = selectedDate.split("-").map(Number);
    const calendar = new Date(Date.UTC(year, month - 1, dayOfMonth));
    const day = calendar.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    calendar.setUTCDate(calendar.getUTCDate() + mondayOffset);
    const monday = calendar.toISOString().slice(0, 10);
    const following = new Date(calendar);
    following.setUTCDate(following.getUTCDate() + 7);
    const followingMonday = following.toISOString().slice(0, 10);
    return {
      fromDate: dateFromKigali(monday),
      toDate: dateFromKigali(followingMonday),
      periodLabel: `Week of ${monday} – ${followingMonday}`,
    };
  }

  if (period === "monthly") {
    // The selected month identifies the complete calendar month.
    const [year, month] = selectedMonth.split("-").map(Number);
    if (!year || !month || month < 1 || month > 12) {
      throw httpError(400, "Please choose a valid month.");
    }
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextFirstDay = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
    const fromDate = dateFromKigali(firstDay);
    return {
      fromDate,
      toDate: dateFromKigali(nextFirstDay),
      periodLabel: new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "Africa/Kigali",
      }).format(fromDate),
    };
  }

  if (period === "yearly") {
    const year = Number(selectedYear);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw httpError(400, "Please choose a valid year.");
    }
    return {
      fromDate: dateFromKigali(`${year}-01-01`),
      toDate: dateFromKigali(`${year + 1}-01-01`),
      periodLabel: String(year),
    };
  }

  // period === "date"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    throw httpError(400, "Please choose a valid date.");
  }
  const [year, month, day] = selectedDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    fromDate: dateFromKigali(selectedDate),
    toDate: dateFromKigali(next.toISOString().slice(0, 10)),
    periodLabel: selectedDate,
  };
}

export async function buildActivityReport(query) {
  const period = String(query.period || "weekly");
  const format = String(query.format || "xlsx").toLowerCase();
  const selectedDate = String(query.date || getKigaliDateString());
  const selectedMonth = String(query.month || selectedDate.slice(0, 7));
  const selectedYear = String(query.year || selectedDate.slice(0, 4));

  if (!["weekly", "monthly", "yearly", "date"].includes(period)) {
    throw httpError(400, "Please choose a valid report period.");
  }
  if (!["xlsx", "pdf"].includes(format)) {
    throw httpError(400, "Please choose Excel or PDF.");
  }

  const { fromDate, toDate, periodLabel } = resolvePeriod({ period, selectedDate, selectedMonth, selectedYear });

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate <= fromDate) {
    throw httpError(400, "Please choose a valid export period.");
  }

  const data = await readAllAdminData();
  const rows = [];

  const add = (at, source, action, details = {}) => {
    if (!at) return;
    const time = new Date(at);
    if (Number.isNaN(time.getTime()) || time < fromDate || time >= toDate) return;

    rows.push({
      date: activityDate(at),
      time: activityTime(at),
      source,
      action: String(action || "").replaceAll("_", " "),
      bookingId: details.bookingId || details.id || "",
      guest: details.guest || details.guestName || details.name || "",
      email: details.email || details.guestEmail || details.subscriberEmail || "",
      room: details.room || "",
      checkIn: details.checkIn || "",
      checkOut: details.checkOut || "",
      status: details.status || details.newStatus || details.previousStatus || "",
      amount: details.totalPrice ?? details.amount ?? "",
      details: JSON.stringify(details),
    });
  };

  // Audit is the source of truth for actions taken (approve/reject/delete);
  // the other sources only add creation/received records.
  for (const item of data.audit) add(item.at, "Audit", item.action, item.details || {});
  for (const item of data.emails) add(
    item.at,
    "Email",
    item.subject || "Email sent",
    { email: (item.to || []).join(", "), messageId: item.messageId || "" }
  );
  for (const item of data.bookings) add(item.createdAt, "Booking", "booking created", item);
  for (const item of data.messages) add(item.createdAt, "Message", "message received", item);
  for (const item of data.subscribers) add(item.subscribedAt, "Subscriber", "subscriber added", item);

  rows.sort((a, b) => {
    const left = `${a.date} ${a.time}`;
    const right = `${b.date} ${b.time}`;
    return left.localeCompare(right);
  });

  const summary = {
    totalActivities: rows.length,
    bookingsCreated: rows.filter(r => r.source === "Booking").length,
    confirmed: rows.filter(r => /confirm|approve/i.test(r.action) || /confirmed/i.test(r.status)).length,
    pending: rows.filter(r => /pending/i.test(r.status)).length,
    rejected: rows.filter(r => /reject/i.test(r.action) || /rejected/i.test(r.status)).length,
    messages: rows.filter(r => r.source === "Message").length,
    subscribers: rows.filter(r => r.source === "Subscriber").length,
    emails: rows.filter(r => r.source === "Email").length,
    confirmedValue: rows
      .filter(r => /confirm|approve/i.test(r.action) || /confirmed/i.test(r.status))
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
  };

  const headers = [
    "Date", "Time", "Source", "Action", "Booking ID", "Guest", "Email",
    "Room", "Check-in", "Check-out", "Status", "Amount (USD)", "Details"
  ];

  const safePeriod = period.replace(/[^a-z]/gi, "") || "activity";
  const stamp = period === "monthly"
    ? selectedMonth.replace(/[^0-9-]/g, "")
    : period === "yearly"
      ? selectedYear.replace(/[^0-9]/g, "")
      : selectedDate.replace(/[^0-9-]/g, "");
  const filenameBase = `gorilla-resort-${safePeriod}-${stamp || getKigaliDateString()}`;

  void appendAudit("activity_exported", {
    period,
    format,
    selectedDate,
    selectedMonth,
    selectedYear,
    from: activityDate(fromDate),
    to: activityDate(new Date(toDate.getTime() - 1)),
    rows: rows.length,
  });

  return { format, rows, summary, headers, periodLabel, fromDate, toDate, filenameBase };
}

export function generateXlsxBuffer({ rows, summary, headers, periodLabel, fromDate, toDate }) {
  const matrix = rows.map(row => [
    row.date, row.time, row.source, row.action, row.bookingId, row.guest,
    row.email, row.room, row.checkIn, row.checkOut, row.status,
    row.amount === "" ? "" : Number(row.amount), row.details
  ]);

  const workbook = XLSX.utils.book_new();

  const reportRows = [
    ["GORILLA RECREATIONAL RESORT"],
    ["Professional Activity Report"],
    ["Report period", periodLabel],
    ["From", activityDate(fromDate)],
    ["To", activityDate(new Date(toDate.getTime() - 1))],
    ["Generated", `${activityDate(new Date())} ${activityTime(new Date())}`],
    [],
    ["REPORT SUMMARY"],
    ["Total activities", summary.totalActivities],
    ["Bookings created", summary.bookingsCreated],
    ["Confirmed / approved actions", summary.confirmed],
    ["Pending activities", summary.pending],
    ["Rejected actions", summary.rejected],
    ["Messages / comments", summary.messages],
    ["Subscribers", summary.subscribers],
    ["Emails", summary.emails],
    ["Confirmed value (USD)", summary.confirmedValue],
    [],
    headers,
    ...matrix,
  ];

  const sheet = XLSX.utils.aoa_to_sheet(reportRows);
  sheet["!cols"] = [
    { wch: 13 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 20 },
    { wch: 22 }, { wch: 32 }, { wch: 28 }, { wch: 13 }, { wch: 13 },
    { wch: 16 }, { wch: 16 }, { wch: 65 },
  ];
  sheet["!freeze"] = { xSplit: 0, ySplit: 19 };
  sheet["!autofilter"] = { ref: `A19:M${Math.max(19, 19 + matrix.length)}` };

  const titleStyle = {
    font: { bold: true, sz: 18, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "17352B" } },
    alignment: { horizontal: "left", vertical: "center" },
  };
  const sectionStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "8B6B2E" } },
  };
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "315C4D" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
  };

  ["A1", "A2"].forEach(cell => { if (sheet[cell]) sheet[cell].s = titleStyle; });
  sheet["A8"].s = sectionStyle;
  for (let c = 0; c < headers.length; c++) {
    const cell = XLSX.utils.encode_cell({ r: 18, c });
    if (sheet[cell]) sheet[cell].s = headerStyle;
  }
  for (let r = 19; r < reportRows.length; r++) {
    const amountCell = sheet[XLSX.utils.encode_cell({ r, c: 11 })];
    if (amountCell && typeof amountCell.v === "number") amountCell.z = '$#,##0.00';
  }
  const summaryAmount = sheet["B17"];
  if (summaryAmount) {
    summaryAmount.z = '$#,##0.00';
    summaryAmount.s = { font: { bold: true } };
  }

  XLSX.utils.book_append_sheet(workbook, sheet, "Activity Report");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function generatePdfBuffer({ rows, summary, headers, periodLabel, fromDate, toDate }) {
  return new Promise((resolve) => {
    // Landscape A4 with a cover/summary block and a readable activity table.
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30, bufferPages: true });
    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const pageWidth = 842;
    const margin = 30;
    const usable = pageWidth - margin * 2;
    const drawHeader = () => {
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#17352B")
        .text("GORILLA RECREATIONAL RESORT", margin, 25);
      doc.font("Helvetica").fontSize(9).fillColor("#555")
        .text("Professional Activity Report", margin, 48);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#17352B")
        .text(periodLabel, margin, 63);
      doc.font("Helvetica").fontSize(8).fillColor("#666")
        .text(`From ${activityDate(fromDate)} to ${activityDate(new Date(toDate.getTime() - 1))}`, 600, 48, { width: 210, align: "right" });
    };

    drawHeader();
    let y = 85;
    const cards = [
      ["Activities", summary.totalActivities],
      ["Bookings", summary.bookingsCreated],
      ["Confirmed", summary.confirmed],
      ["Rejected", summary.rejected],
      ["Messages", summary.messages],
      ["Subscribers", summary.subscribers],
      ["Revenue", `$${summary.confirmedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
    ];
    const cardW = (usable - 36) / 7;
    cards.forEach(([label, value], i) => {
      const x = margin + i * (cardW + 6);
      doc.roundedRect(x, y, cardW, 42, 6).fillAndStroke("#F3EEE3", "#D9CFB9");
      doc.font("Helvetica-Bold").fontSize(13).fillColor("#17352B")
        .text(String(value), x + 6, y + 7, { width: cardW - 12, align: "center" });
      doc.font("Helvetica").fontSize(7).fillColor("#555")
        .text(label, x + 4, y + 25, { width: cardW - 8, align: "center" });
    });
    y += 55;

    const widths = [48, 48, 45, 65, 62, 55, 85, 75, 48, 48, 55, 55, 93];
    const rowHeight = 23;
    const drawTableHeader = () => {
      let x = margin;
      doc.rect(margin, y, usable, rowHeight).fill("#315C4D");
      headers.forEach((header, i) => {
        doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#FFFFFF")
          .text(header, x + 3, y + 7, { width: widths[i] - 6, height: rowHeight - 6, ellipsis: true });
        x += widths[i];
      });
      y += rowHeight;
    };

    drawTableHeader();
    rows.forEach((row, index) => {
      if (y + rowHeight > 565) {
        doc.addPage();
        y = 55;
        drawHeader();
        y = 85;
        drawTableHeader();
      }
      if (index % 2 === 0) {
        doc.rect(margin, y, usable, rowHeight).fill("#F8F5EE");
      }
      const values = [
        row.date, row.time, row.source, row.action, row.bookingId, row.guest,
        row.email, row.room, row.checkIn, row.checkOut, row.status,
        row.amount === "" ? "" : `$${Number(row.amount).toLocaleString()}`, row.details
      ];
      let x = margin;
      values.forEach((value, i) => {
        doc.font("Helvetica").fontSize(6.2).fillColor("#222")
          .text(String(value ?? ""), x + 3, y + 7, {
            width: widths[i] - 6,
            height: rowHeight - 6,
            ellipsis: true,
          });
        x += widths[i];
      });
      y += rowHeight;
    });

    if (!rows.length) {
      doc.font("Helvetica").fontSize(10).fillColor("#666")
        .text("No activity was recorded for this period.", margin, y + 15);
    }

    const rangePages = doc.bufferedPageRange();
    for (let i = 0; i < rangePages.count; i++) {
      doc.switchToPage(i);
      doc.font("Helvetica").fontSize(7).fillColor("#777")
        .text(`Gorilla Recreational Resort • ${periodLabel} • Page ${i + 1} of ${rangePages.count}`, margin, 575, {
          width: usable,
          align: "center",
        });
    }

    doc.end();
  });
}
