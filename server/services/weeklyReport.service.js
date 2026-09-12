import { MANAGER_EMAIL } from "../config/index.js";
import { esc } from "../utils.js";
import { sendEmail } from "./mailer.service.js";
import { appendAudit } from "./audit.service.js";
import { readAllAdminData } from "./dashboard.service.js";

export async function sendWeeklyReport() {
  try {
    const data = await readAllAdminData();
    const since = new Date(Date.now() - 7 * 86400000);
    const inWindow = item => {
      const value = item.at || item.createdAt || item.subscribedAt || item.approvedAt || item.confirmedAt || item.rejectedAt || item.deletedAt;
      return value && new Date(value) >= since;
    };
    const bookings = data.bookings.filter(inWindow);
    const requests = bookings.filter(b => b.status === "pending");
    const confirmed = bookings.filter(b => b.status === "confirmed" || b.status === "approved");
    const rejected = bookings.filter(b => b.status === "rejected");
    const messages = data.messages.filter(inWindow);
    const subscribers = data.subscribers.filter(inWindow);
    const audit = data.audit.filter(inWindow);
    const emails = data.emails.filter(inWindow);
    const totalRevenue = confirmed.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
    const rows = bookings.length ? bookings.map(b => `
      <tr><td>${esc(b.name)}</td><td>${esc(b.room)}</td><td>${esc(b.checkIn)} → ${esc(b.checkOut)}</td><td>${esc(b.status)}</td><td>$${Number(b.totalPrice || 0).toLocaleString()}</td></tr>`).join("") : `<tr><td colspan="5">No booking activity in the last 7 days.</td></tr>`;
    await sendEmail({
      from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
      to: MANAGER_EMAIL,
      subject: `📊 Weekly Resort Activity Report — ${new Date().toLocaleDateString("en-US", { timeZone: "Africa/Kigali" })}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:800px;margin:auto;background:#f8f3e9;padding:28px;border-radius:18px;color:#172016">
          <h1 style="margin-top:0">📊 Weekly Resort Activity Report</h1>
          <p>Activity from the last 7 days, including website requests, approvals, rejections, messages, subscribers and email activity.</p>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
            <div style="background:white;padding:16px;border-radius:12px"><b>${requests.length}</b><br>Pending requests</div>
            <div style="background:white;padding:16px;border-radius:12px"><b>${confirmed.length}</b><br>Confirmed</div>
            <div style="background:white;padding:16px;border-radius:12px"><b>${rejected.length}</b><br>Rejected</div>
            <div style="background:white;padding:16px;border-radius:12px"><b>${messages.length}</b><br>Messages/comments</div>
            <div style="background:white;padding:16px;border-radius:12px"><b>${subscribers.length}</b><br>New subscribers</div>
            <div style="background:white;padding:16px;border-radius:12px"><b>${emails.length}</b><br>Emails sent</div>
          </div>
          <p style="font-size:18px"><b>Confirmed booking value:</b> $${totalRevenue.toLocaleString()}</p>
          <h2>Booking activity</h2>
          <table style="width:100%;border-collapse:collapse;background:white"><thead><tr><th style="padding:8px;text-align:left">Guest</th><th style="padding:8px;text-align:left">Room</th><th style="padding:8px;text-align:left">Stay</th><th style="padding:8px;text-align:left">Status</th><th style="padding:8px;text-align:left">Value</th></tr></thead><tbody>${rows}</tbody></table>
          <p style="font-size:12px;color:#666;margin-top:24px">Audit events recorded this week: ${audit.length}. This report is generated automatically by the resort server.</p>
        </div>`,
    });
    await appendAudit("weekly_report_sent", { periodDays: 7, bookings: bookings.length, messages: messages.length, subscribers: subscribers.length });
  } catch (error) {
    console.error("Weekly report error:", error);
  }
}

export function scheduleWeeklyReport() {
  const now = new Date();
  const target = new Date(now);
  target.setUTCHours(6, 0, 0, 0); // 08:00 Africa/Kigali (UTC+2)
  const daysUntilMonday = (8 - target.getUTCDay()) % 7;
  target.setUTCDate(target.getUTCDate() + daysUntilMonday);
  if (target <= now) target.setUTCDate(target.getUTCDate() + 7);
  const delay = Math.max(60 * 1000, target.getTime() - now.getTime());
  setTimeout(() => {
    sendWeeklyReport();
    setInterval(sendWeeklyReport, 7 * 86400000);
  }, delay);
}
