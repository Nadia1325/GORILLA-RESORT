import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 5000);

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

const API_PUBLIC_URL =
  process.env.API_PUBLIC_URL || `http://localhost:${PORT}`;

const MANAGER_EMAIL =
  process.env.MANAGER_EMAIL || "resortgorilla@gmail.com";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bookingsFile = path.join(
  __dirname,
  "data",
  "bookings.json"
);


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const allowed = new Set([
        FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
      ]);

      if (allowed.has(origin)) {
        return callback(null, true);
      }

      if (
        process.env.NODE_ENV !== "production" &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS blocked this frontend origin.")
      );
    },
  })
);

app.use(express.json());


// ============================================================
// GMAIL / NODEMAILER
// ============================================================

function mailer() {
  if (
    !process.env.GMAIL_USER ||
    !process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD === "your_google_app_password"
  ) {
    throw new Error(
      "Gmail is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },

    tls: {
      rejectUnauthorized: false,
    },
  });
}


// ============================================================
// FILE HELPERS
// ============================================================

async function readBookings() {
  try {
    const data = await fs.readFile(
      bookingsFile,
      "utf8"
    );

    const parsed = JSON.parse(data);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    return [];
  }
}


async function writeBookings(items) {
  await fs.mkdir(
    path.dirname(bookingsFile),
    {
      recursive: true,
    }
  );

  await fs.writeFile(
    bookingsFile,
    JSON.stringify(items, null, 2),
    "utf8"
  );
}


// Persistent guest communication data.
// Keeping these records means a successful form submission
// is not lost even if email delivery is delayed.

const subscribersFile = path.join(
  __dirname,
  "data",
  "subscribers.json"
);

const messagesFile = path.join(
  __dirname,
  "data",
  "messages.json"
);

const auditFile = path.join(__dirname, "data", "audit-log.json");
const emailLogFile = path.join(__dirname, "data", "email-log.json");
const notificationDedupeFile = path.join(__dirname, "data", "notification-dedupe.json");
const adminResetFile = path.join(__dirname, "data", "admin-reset.json");
const adminAuthFile = path.join(__dirname, "data", "admin-auth.json");

const MANAGER_LOGIN_EMAIL =
  String(process.env.MANAGER_LOGIN_EMAIL || MANAGER_EMAIL).trim().toLowerCase();
let managerPasswordHash = String(process.env.MANAGER_PASSWORD_HASH || "");
let managerPasswordSalt = String(process.env.MANAGER_PASSWORD_SALT || "");
const SESSION_COOKIE = "grr_manager_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map();

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

async function loadManagerAuth() {
  try {
    const saved = JSON.parse(await fs.readFile(adminAuthFile, "utf8"));
    if (saved.email === MANAGER_LOGIN_EMAIL && saved.passwordHash && saved.passwordSalt) {
      managerPasswordHash = saved.passwordHash;
      managerPasswordSalt = saved.passwordSalt;
    }
  } catch {
    // Environment credentials remain the initial source of truth.
  }
}

function passwordMatches(password) {
  if (!managerPasswordHash || !managerPasswordSalt) return false;
  const actual = Buffer.from(hashPassword(password, managerPasswordSalt), "hex");
  const expected = Buffer.from(managerPasswordHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return Object.fromEntries(
    raw.split(";").filter(Boolean).map(part => {
      const index = part.indexOf("=");
      return index >= 0
        ? [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())]
        : [part.trim(), ""];
    })
  );
}

function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

function getManagerSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return session;
}

function requireManager(req, res, next) {
  const session = getManagerSession(req);
  if (!session) return res.status(401).json({ message: "Manager login required." });
  req.manager = session;
  next();
}


async function readJsonArray(file) {
  try {
    const data = await fs.readFile(
      file,
      "utf8"
    );

    const parsed = JSON.parse(data);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}


async function appendJsonItem(file, item) {
  const items = await readJsonArray(file);

  items.push(item);

  await fs.mkdir(
    path.dirname(file),
    {
      recursive: true,
    }
  );

  await fs.writeFile(
    file,
    JSON.stringify(items, null, 2),
    "utf8"
  );

  return item;
}

async function appendAudit(action, details = {}) {
  return appendJsonItem(auditFile, {
    id: `AUD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex")}`,
    action,
    at: new Date().toISOString(),
    details,
  });
}

async function sendEmail(options) {
  const dedupeKey = String(options.dedupeKey || "").trim();
  if (dedupeKey) {
    const sentKeys = await readJsonArray(notificationDedupeFile);
    if (sentKeys.some(item => item.key === dedupeKey)) {
      return { messageId: "", skippedDuplicate: true };
    }
  }

  const result = await mailer().sendMail(options);
  try {
    await appendJsonItem(emailLogFile, {
      id: `EML-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex")}`,
      at: new Date().toISOString(),
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject || "",
      messageId: result.messageId || "",
      dedupeKey: dedupeKey || undefined,
    });
    if (dedupeKey) {
      await appendJsonItem(notificationDedupeFile, {
        key: dedupeKey,
        at: new Date().toISOString(),
      });
    }
  } catch (logError) {
    console.error("Email log error:", logError);
  }
  return result;
}

async function notifyManagerDashboardAction(action, details = {}, dedupeKey = "") {
  try {
    const detailRows = Object.entries(details)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `<tr><td style="padding:7px 10px;border-bottom:1px solid #eee;font-weight:bold">${esc(String(key))}</td><td style="padding:7px 10px;border-bottom:1px solid #eee">${esc(String(value))}</td></tr>`)
      .join("");

    await sendEmail({
      from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
      to: MANAGER_EMAIL,
      subject: `🔔 Manager dashboard activity — ${action}`,
      dedupeKey: dedupeKey || "",
      html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;padding:28px;background:#f8f3e9;border-radius:18px;color:#172016"><h1 style="margin-top:0">🔔 Manager Dashboard Activity</h1><p><b>Action:</b> ${esc(action)}</p><p><b>Time:</b> ${esc(new Date().toLocaleString("en-US", { timeZone: "Africa/Kigali" }))}</p>${detailRows ? `<table style="width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden">${detailRows}</table>` : ""}<p style="font-size:12px;color:#666;margin-top:22px">This notification was generated automatically by the Gorilla Resort manager dashboard.</p></div>`,
    });
  } catch (error) {
    console.error(`Manager dashboard notification failed (${action}):`, error);
  }
}

async function readAllAdminData() {
  const [bookings, messages, subscribers, audit, emails] = await Promise.all([
    readBookings(),
    readJsonArray(messagesFile),
    readJsonArray(subscribersFile),
    readJsonArray(auditFile),
    readJsonArray(emailLogFile),
  ]);
  return { bookings, messages, subscribers, audit, emails };
}

function roomPricing(room = "") {
  const vip = /Room\s+I\s*[·-]\s*MUHABURA/i.test(room);
  return {
    tier: vip ? "VIP" : "Standard",
    nightlyPrice: vip ? 350 : 200,
    currency: "USD",
  };
}

function nightsBetween(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

async function sendWeeklyReport() {
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

function scheduleWeeklyReport() {
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



// ============================================================
// SECURITY / VALIDATION HELPERS
// ============================================================

const esc = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]
  );


const isValidEmail = (value = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value).trim()
  );


// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  "/api/health",
  (_req, res) => {
    res.json({
      ok: true,

      gmailConfigured: Boolean(
        process.env.GMAIL_USER &&
        process.env.GMAIL_APP_PASSWORD &&
        process.env.GMAIL_APP_PASSWORD !==
          "your_google_app_password"
      ),
    });
  }
);


// ============================================================
// VERIFY GMAIL CONNECTION
// ============================================================

if (
  process.env.GMAIL_USER &&
  process.env.GMAIL_APP_PASSWORD &&
  process.env.GMAIL_APP_PASSWORD !==
    "your_google_app_password"
) {
  mailer()
    .verify()
    .then(() => {
      console.log(
        "Gmail connection verified successfully."
      );
    })
    .catch((error) => {
      console.error(
        "Gmail connection check failed:",
        error.message
      );
    });
} else {
  console.warn(
    "Gmail is not configured yet. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env before testing email forms."
  );
}


function getKigaliDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kigali",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

// ============================================================
// ROOM AVAILABILITY
// ============================================================

app.get(
  "/api/availability",
  async (req, res) => {
    try {
      const {
        checkIn,
        checkOut,
      } = req.query;

      if (!checkIn || !checkOut) {
        return res.json({
          unavailable: [],
        });
      }

      const start = new Date(
        checkIn
      );

      const end = new Date(
        checkOut
      );

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start ||
        String(checkIn) < getKigaliDateString()
      ) {
        return res.status(400).json({
          message:
            "Please choose valid stay dates.",
        });
      }

      const items =
        await readBookings();

      const unavailable = [
        ...new Set(
          items
            .filter(
              (booking) =>
                (
                  booking.status ===
                    "approved" ||
                  booking.status ===
                    "confirmed"
                ) &&
                start <
                  new Date(
                    booking.checkOut
                  ) &&
                end >
                  new Date(
                    booking.checkIn
                  )
            )
            .map(
              (booking) =>
                booking.room
            )
        ),
      ];

      res.json({
        unavailable,
      });

    } catch (error) {
      console.error(
        "Availability error:",
        error
      );

      res.status(500).json({
        message:
          "Could not check room availability.",
      });
    }
  }
);


// ============================================================
// CREATE BOOKING
// ============================================================

app.post(
  "/api/bookings",
  async (req, res) => {
    try {
      const {
        room,
        name,
        email,
        phone,
        location,
        checkIn,
        checkOut,
        guests,
        specialRequests = "",
        packageName = "",
      } = req.body;


      // --------------------------------------------------------
      // REQUIRED FIELDS
      // --------------------------------------------------------

      if (
        ![
          room,
          name,
          email,
          phone,
          location,
          checkIn,
          checkOut,
          guests,
        ].every(
          (value) =>
            String(
              value ?? ""
            ).trim()
        )
      ) {
        return res.status(400).json({
          message:
            "Please complete all required booking fields.",
        });
      }


      // --------------------------------------------------------
      // EMAIL VALIDATION
      // --------------------------------------------------------

      if (!isValidEmail(email)) {
        return res.status(400).json({
          message:
            "Please enter a valid email address so we can send your booking ticket.",
        });
      }


      // --------------------------------------------------------
      // DATE VALIDATION
      // --------------------------------------------------------

      const checkInDate =
        new Date(checkIn);

      const checkOutDate =
        new Date(checkOut);

      if (
        Number.isNaN(
          checkInDate.getTime()
        ) ||
        Number.isNaN(
          checkOutDate.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Please choose valid check-in and check-out dates.",
        });
      }


      if (
        checkOutDate <=
        checkInDate
      ) {
        return res.status(400).json({
          message:
            "Check-out must be after check-in.",
        });
      }

      if (String(checkIn) < getKigaliDateString()) {
        return res.status(400).json({
          message:
            "Check-in must be today or a future date. Earlier dates cannot be booked.",
        });
      }


      // --------------------------------------------------------
      // READ EXISTING BOOKINGS
      // --------------------------------------------------------

      const existingBookings =
        await readBookings();


      // --------------------------------------------------------
      // CHECK ROOM OVERLAP
      // --------------------------------------------------------

      const overlapping =
        existingBookings.some(
          (booking) =>
            booking.room === room &&
            (
              booking.status ===
                "pending" ||
              booking.status ===
                "approved" ||
              booking.status ===
                "confirmed"
            ) &&
            checkInDate <
              new Date(
                booking.checkOut
              ) &&
            checkOutDate >
              new Date(
                booking.checkIn
              )
        );


      if (overlapping) {
        return res.status(409).json({
          message:
            "That room has just been requested for those dates. Please choose another room or different dates.",
        });
      }


      // --------------------------------------------------------
      // CREATE BOOKING
      // --------------------------------------------------------

      const booking = {
        id:
          `GRR-${Date.now().toString(36).toUpperCase()}`,

        approvalToken:
          crypto.randomBytes(24).toString(
            "hex"
          ),

        room,
        name,
        email,
        phone,
        location,
        checkIn,
        checkOut,
        guests,
        specialRequests,
        packageName,

        ...roomPricing(room),
        nights: nightsBetween(checkIn, checkOut),
        totalPrice: roomPricing(room).nightlyPrice * nightsBetween(checkIn, checkOut),
        status: "pending",

        createdAt:
          new Date().toISOString(),
      };


      // --------------------------------------------------------
      // SAVE BOOKING FIRST
      // --------------------------------------------------------

      existingBookings.push(
        booking
      );

      await writeBookings(
        existingBookings
      );


      console.log(
        `Booking saved successfully: ${booking.id}`
      );
      await appendAudit("booking_created", { bookingId: booking.id, guest: booking.name, room: booking.room, checkIn: booking.checkIn, checkOut: booking.checkOut, totalPrice: booking.totalPrice });


      // ========================================================
      // APPROVAL LINK
      // ========================================================

      const approveUrl =
        `${API_PUBLIC_URL}/api/bookings/${booking.id}/approve?token=${booking.approvalToken}`;
      const rejectUrl =
        `${API_PUBLIC_URL}/api/bookings/${booking.id}/reject?token=${booking.approvalToken}`;


      // ========================================================
      // EMAIL DELIVERY
      //
      // IMPORTANT:
      // Email is OPTIONAL after the booking is saved.
      // If Gmail fails, the booking remains successful.
      // ========================================================

      let managerEmailSent =
        false;

      let guestEmailSent =
        false;


      // ========================================================
      // EMAIL #1
      // MANAGER: NEW BOOKING REQUEST
      // ========================================================

      try {
        await sendEmail({
          from:
            `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,

          to:
            MANAGER_EMAIL,

          subject:
            `🟡 NEW BOOKING REQUEST — ${booking.id}`,

          html: `
            <div style="
              font-family:Arial,sans-serif;
              max-width:650px;
              margin:auto;
              background:#f8f3e9;
              padding:25px;
              border-radius:18px;
            ">

              <h1 style="
                color:#b8860b;
                margin-top:0;
              ">
                🟡 NEW BOOKING REQUEST
              </h1>

              <p>
                A new room booking request has been received.
              </p>

              <hr>

              <p>
                <b>Guest:</b>
                ${esc(name)}
              </p>

              <p>
                <b>Email:</b>
                ${esc(email)}
              </p>

              <p>
                <b>Phone:</b>
                ${esc(phone)}
              </p>

              <p>
                <b>Location:</b>
                ${esc(location)}
              </p>

              <p>
                <b>Room:</b>
                ${esc(room)}
              </p>

              <p>
                <b>Stay:</b>
                ${esc(checkIn)}
                to
                ${esc(checkOut)}
              </p>

              <p>
                <b>Guests:</b>
                ${esc(guests)}
              </p>

              <p>
                <b>Package:</b>
                ${esc(
                  packageName ||
                  "Standard stay"
                )}
              </p>

              <p>
                <b>Requests:</b>
                ${esc(
                  specialRequests ||
                  "None"
                )}
              </p>

              <p>
                <b>Rate:</b>
                $${booking.nightlyPrice} / night (${esc(booking.tier)})
              </p>

              <p>
                <b>Estimated total:</b>
                $${Number(booking.totalPrice || 0).toLocaleString()}
              </p>

              <p>
                <b>Status:</b>
                🟡 PENDING
              </p>

              <br>

              <a
                href="${approveUrl}"
                style="
                  display:inline-block;
                  padding:15px 25px;
                  background:#168a32;
                  color:white;
                  text-decoration:none;
                  border-radius:8px;
                  font-weight:bold;
                  font-size:16px;
                "
              >
                🟢 APPROVE BOOKING
              </a>

              <a
                href="${rejectUrl}"
                style="
                  display:inline-block;
                  margin-left:10px;
                  padding:15px 25px;
                  background:#9b2c2c;
                  color:white;
                  text-decoration:none;
                  border-radius:8px;
                  font-weight:bold;
                  font-size:16px;
                "
              >
                🔴 REJECT BOOKING
              </a>

              <p style="
                margin-top:25px;
                font-size:12px;
                color:#666;
              ">
                Clicking the button will confirm this booking
                and automatically send confirmation emails.
              </p>

            </div>
          `,
        });

        managerEmailSent =
          true;

        console.log(
          `New booking notification sent to ${MANAGER_EMAIL}`
        );

      } catch (managerEmailError) {
        console.error(
          "Manager booking email failed:",
          managerEmailError
        );
      }


      // ========================================================
      // EMAIL #2
      // GUEST: BOOKING RECEIVED
      // ========================================================

      try {
        await sendEmail({
          from:
            `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,

          to:
            email,

          subject:
            `Booking request received — ${booking.id}`,

          html: `
            <div style="
              font-family:Arial,sans-serif;
              max-width:650px;
              margin:auto;
            ">

              <h2>
                🟡 Booking Request Received
              </h2>

              <p>
                Murakaza neza,
                <b>${esc(name)}</b>.
              </p>

              <p>
                We received your booking request for:
              </p>

              <p>
                <b>${esc(room)}</b>
              </p>

              <p>
                ${esc(checkIn)}
                to
                ${esc(checkOut)}
              </p>

              <p>
                <b>Status:</b>
                🟡 PENDING
              </p>

              <p>
                Booking ID:
                <b>${esc(booking.id)}</b>
              </p>

              <p>
                Our manager will review your request.
                You will receive another email when your
                booking is confirmed.
              </p>

            </div>
          `,
        });

        guestEmailSent =
          true;

        console.log(
          `Booking received email sent to ${email}`
        );

      } catch (guestEmailError) {
        console.error(
          "Guest booking received email failed:",
          guestEmailError
        );
      }


      // ========================================================
      // RESPONSE
      //
      // BOOKING IS SUCCESSFUL EVEN IF EMAIL FAILS
      // ========================================================

      let responseMessage =
        "Booking request saved successfully.";

      if (
        managerEmailSent &&
        guestEmailSent
      ) {
        responseMessage =
          "Booking request sent successfully. Please check your email for confirmation.";

      } else if (
        managerEmailSent &&
        !guestEmailSent
      ) {
        responseMessage =
          "Booking request saved successfully. The resort manager has been notified, but the guest confirmation email could not be delivered right now.";

      } else if (
        !managerEmailSent &&
        guestEmailSent
      ) {
        responseMessage =
          "Booking request saved successfully. Your confirmation email was sent, but the resort manager notification could not be delivered right now.";

      } else {
        responseMessage =
          "Booking request saved successfully. Email delivery is temporarily unavailable.";
      }


      return res.status(201).json({
        message:
          responseMessage,

        bookingId:
          booking.id,

        saved:
          true,

        emailSent:
          managerEmailSent &&
          guestEmailSent,

        managerEmailSent,

        guestEmailSent,
      });

    } catch (error) {

      console.error(
        "Booking creation error:",
        error
      );

      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Could not send booking request.",
      });
    }
  }
);


// ============================================================
// APPROVE / CONFIRM BOOKING
// ============================================================

app.get(
  "/api/bookings/:id/approve",
  async (req, res) => {

    try {

      // --------------------------------------------------------
      // FIND BOOKING
      // --------------------------------------------------------

      const items =
        await readBookings();

      const booking =
        items.find(
          (item) =>
            item.id ===
              req.params.id &&
            item.approvalToken ===
              req.query.token
        );


      if (!booking) {

        return res.status(404).send(`
          <html>

            <head>
              <title>Invalid Approval Link</title>
            </head>

            <body style="
              font-family:Arial;
              padding:40px;
              background:#f8f3e9;
            ">

              <h1>
                ❌ Invalid approval link
              </h1>

              <p>
                This booking approval link is invalid
                or expired.
              </p>

            </body>

          </html>
        `);
      }


      // --------------------------------------------------------
      // PREVENT DUPLICATE EMAILS
      // --------------------------------------------------------

      if (
        booking.status ===
        "confirmed"
      ) {

        return res.send(`
          <html>

            <head>
              <title>
                Booking Already Confirmed
              </title>
            </head>

            <body style="
              font-family:Arial;
              padding:40px;
              background:#f8f3e9;
              color:#0b1d0a;
            ">

              <div style="
                max-width:650px;
                margin:auto;
                background:white;
                padding:35px;
                border-radius:20px;
                text-align:center;
              ">

                <div style="
                  font-size:55px;
                ">
                  🟢
                </div>

                <h1>
                  BOOKING ALREADY CONFIRMED
                </h1>

                <p>
                  <b>Guest:</b>
                  ${esc(booking.name)}
                </p>

                <p>
                  <b>Room:</b>
                  ${esc(booking.room)}
                </p>

                <p>
                  <b>Status:</b>
                  🟢 CONFIRMED ✓
                </p>

                <p>
                  This booking has already been confirmed.
                </p>

              </div>

            </body>

          </html>
        `);
      }


      // ========================================================
      // CHANGE STATUS
      // ========================================================

      const approvedAt =
        new Date();

      booking.status =
        "confirmed";

      booking.approvedAt =
        approvedAt.toISOString();

      booking.confirmedAt =
        approvedAt.toISOString();


      // SAVE NEW STATUS
      await writeBookings(items);
      await appendAudit("booking_confirmed", { bookingId: booking.id, guest: booking.name, room: booking.room, totalPrice: booking.totalPrice });


      // ========================================================
      // FORMAT APPROVAL TIME
      // ========================================================

      const approvedTime =
        approvedAt.toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone:
              "Africa/Kigali",
          }
        );


      const approvedDate =
        approvedAt.toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone:
              "Africa/Kigali",
          }
        );


      // ========================================================
      // EMAIL #3
      // GUEST: CONFIRMED
      // ========================================================

      try {

        await sendEmail({

          from:
            `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,

          to:
            booking.email,

          subject:
            `🟢 BOOKING CONFIRMED — ${booking.id}`,

          html: `
            <div style="
              font-family:Arial,sans-serif;
              max-width:650px;
              margin:auto;
              background:#f8f3e9;
              border-radius:18px;
              overflow:hidden;
              border:1px solid #d9be72;
            ">

              <div style="
                background:#0B1D0A;
                color:white;
                padding:28px;
              ">

                <h1 style="margin:0">
                  🟢 BOOKING CONFIRMED
                </h1>

                <p>
                  Gorilla Recreational Resort
                </p>

              </div>

              <div style="padding:28px">

                <h2>
                  Murakaza neza,
                  ${esc(booking.name)}!
                </h2>

                <p>
                  Your booking has been successfully confirmed.
                </p>

                <table style="
                  width:100%;
                  border-collapse:collapse;
                ">

                  <tr>
                    <td style="padding:10px 0">
                      <b>Guest</b>
                    </td>

                    <td style="padding:10px 0">
                      ${esc(booking.name)}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0">
                      <b>Room</b>
                    </td>

                    <td style="padding:10px 0">
                      ${esc(booking.room)}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0">
                      <b>Stay</b>
                    </td>

                    <td style="padding:10px 0">
                      ${esc(booking.checkIn)}
                      to
                      ${esc(booking.checkOut)}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0">
                      <b>Guests</b>
                    </td>

                    <td style="padding:10px 0">
                      ${esc(booking.guests)}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0">
                      <b>Rate</b>
                    </td>
                    <td style="padding:10px 0">
                      $${booking.nightlyPrice} / night (${esc(booking.tier)}) · Total $${Number(booking.totalPrice || 0).toLocaleString()}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0">
                      <b>Booking ID</b>
                    </td>

                    <td style="padding:10px 0">
                      ${esc(booking.id)}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 0">
                      <b>Status</b>
                    </td>

                    <td style="
                      padding:10px 0;
                      font-size:18px;
                      font-weight:bold;
                    ">
                      🟢 CONFIRMED ✓
                    </td>
                  </tr>

                </table>

                <p style="
                  margin-top:25px;
                ">
                  Please keep this email as your
                  booking confirmation.
                </p>

              </div>

            </div>
          `,
        });

        console.log(
          `Guest confirmation sent to ${booking.email}`
        );

      } catch (guestEmailError) {

        console.error(
          "Guest confirmation email failed:",
          guestEmailError
        );
      }


      // ========================================================
      // EMAIL #4
      // MANAGER: BOOKING CONFIRMED
      // ========================================================

      try {

        await sendEmail({

          from:
            `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,

          // THIS IS THE MANAGER EMAIL
          to:
            MANAGER_EMAIL,

          subject:
            `🟢 BOOKING CONFIRMED — ${booking.id}`,

          html: `
            <div style="
              font-family:Arial,sans-serif;
              max-width:650px;
              margin:auto;
              background:#f8f3e9;
              border-radius:18px;
              overflow:hidden;
              border:1px solid #d9be72;
            ">

              <div style="
                background:#0B1D0A;
                color:white;
                padding:28px;
              ">

                <h1 style="
                  margin:0;
                  font-size:28px;
                ">
                  🟢 BOOKING CONFIRMED
                </h1>

                <p style="
                  margin:10px 0 0;
                ">
                  Gorilla Recreational Resort
                </p>

              </div>


              <div style="padding:28px">

                <h2>
                  Booking successfully approved
                </h2>

                <p>
                  The manager approval button was clicked
                  successfully.
                </p>


                <hr>


                <p>
                  <b>Guest:</b>
                  ${esc(booking.name)}
                </p>


                <p>
                  <b>Email:</b>
                  ${esc(booking.email)}
                </p>


                <p>
                  <b>Phone:</b>
                  ${esc(booking.phone)}
                </p>


                <p>
                  <b>Location:</b>
                  ${esc(booking.location)}
                </p>


                <p>
                  <b>Room:</b>
                  ${esc(booking.room)}
                </p>


                <p>
                  <b>Stay:</b>
                  ${esc(booking.checkIn)}
                  to
                  ${esc(booking.checkOut)}
                </p>


                <p>
                  <b>Guests:</b>
                  ${esc(booking.guests)}
                </p>


                <p>
                  <b>Package:</b>
                  ${esc(
                    booking.packageName ||
                    "Standard stay"
                  )}
                </p>


                <p>
                  <b>Requests:</b>
                  ${esc(
                    booking.specialRequests ||
                    "None"
                  )}
                </p>

                <p>
                  <b>Rate:</b>
                  $${booking.nightlyPrice} / night (${esc(booking.tier)}) · Total $${Number(booking.totalPrice || 0).toLocaleString()}
                </p>


                <!-- CONFIRMED BOX -->

                <div style="
                  margin-top:30px;
                  padding:22px;
                  background:#e9f6e7;
                  border:1px solid #a8d5a2;
                  border-radius:12px;
                ">

                  <div style="
                    font-size:24px;
                    font-weight:bold;
                    color:#176b20;
                  ">
                    🟢 BOOKING CONFIRMED
                  </div>


                  <p style="
                    font-size:18px;
                    font-weight:bold;
                    margin-bottom:8px;
                  ">
                    Status: CONFIRMED ✓
                  </p>


                  <p style="
                    margin:6px 0;
                  ">
                    Approved at:
                    <b>${approvedTime}</b>
                  </p>


                  <p style="
                    margin:6px 0;
                  ">
                    ${approvedDate}
                  </p>

                </div>


                <!-- BOOKING ID -->

                <div style="
                  margin-top:25px;
                  padding:18px;
                  background:white;
                  border-radius:10px;
                  border:1px solid #ddd;
                ">

                  <b>
                    Booking ID:
                  </b>

                  ${esc(booking.id)}

                </div>


                <p style="
                  margin-top:25px;
                  color:#555;
                ">
                  A confirmation email has also been
                  sent to the guest.
                </p>

              </div>

            </div>
          `,
        });

        console.log(
          `Manager confirmation sent to ${MANAGER_EMAIL}`
        );

      } catch (managerEmailError) {

        console.error(
          "Manager confirmation email failed:",
          managerEmailError
        );
      }


      // ========================================================
      // SUCCESS PAGE AFTER CLICK
      // ========================================================

      res.send(`
        <html>

          <head>

            <title>
              Booking Confirmed
            </title>

          </head>


          <body style="
            margin:0;
            padding:40px;
            background:#f8f3e9;
            font-family:Arial,sans-serif;
            color:#0B1D0A;
          ">


            <div style="
              max-width:650px;
              margin:auto;
              background:white;
              padding:35px;
              border-radius:20px;
              box-shadow:0 5px 25px rgba(0,0,0,.12);
              text-align:center;
            ">


              <div style="
                font-size:60px;
              ">
                🟢
              </div>


              <h1>
                BOOKING CONFIRMED ✓
              </h1>


              <p style="
                font-size:18px;
              ">
                The booking for
                <b>${esc(booking.name)}</b>
                has been confirmed.
              </p>


              <div style="
                margin:25px 0;
                padding:20px;
                background:#e9f6e7;
                border-radius:12px;
                text-align:left;
              ">

                <p>
                  <b>Guest:</b>
                  ${esc(booking.name)}
                </p>


                <p>
                  <b>Room:</b>
                  ${esc(booking.room)}
                </p>


                <p>
                  <b>Stay:</b>
                  ${esc(booking.checkIn)}
                  to
                  ${esc(booking.checkOut)}
                </p>


                <p>
                  <b>Status:</b>
                  🟢 CONFIRMED ✓
                </p>


                <p>
                  <b>Approved at:</b>
                  ${approvedTime}
                </p>


                <p>
                  <b>Booking ID:</b>
                  ${esc(booking.id)}
                </p>

              </div>


              <p>
                Confirmation emails have been sent
                to the guest and manager.
              </p>

            </div>

          </body>

        </html>
      `);


    } catch (error) {

      console.error(
        "Approval error:",
        error
      );

      res.status(500).send(`
        <html>

          <body style="
            font-family:Arial;
            padding:40px;
          ">

            <h1>
              ❌ Could not confirm booking
            </h1>

            <p>
              ${esc(
                error instanceof Error
                  ? error.message
                  : "Unknown error"
              )}
            </p>

          </body>

        </html>
      `);
    }
  }
);


// ============================================================
// REJECT BOOKING
// ============================================================

app.get("/api/bookings/:id/reject", async (req, res) => {
  try {
    const items = await readBookings();
    const booking = items.find(item => item.id === req.params.id && item.approvalToken === req.query.token);
    if (!booking) return res.status(404).send(`<html><body style="font-family:Arial;padding:40px"><h1>❌ Invalid rejection link</h1><p>This booking action link is invalid or expired.</p></body></html>`);
    if (booking.status === "rejected") return res.send(`<html><body style="font-family:Arial;padding:40px;background:#f8f3e9"><div style="max-width:650px;margin:auto;background:white;padding:35px;border-radius:20px"><h1>🔴 BOOKING ALREADY REJECTED</h1><p><b>Guest:</b> ${esc(booking.name)}</p><p><b>Room:</b> ${esc(booking.room)}</p><p>The dates are available again for new requests.</p></div></body></html>`);
    if (booking.status === "confirmed" || booking.status === "approved") return res.status(409).send(`<html><body style="font-family:Arial;padding:40px"><h1>⚠️ Booking already confirmed</h1><p>This booking cannot be rejected because it is already confirmed.</p></body></html>`);
    booking.status = "rejected";
    booking.rejectedAt = new Date().toISOString();
    booking.rejectionReason = "Rejected by resort manager";
    await writeBookings(items);
    await appendAudit("booking_rejected", { bookingId: booking.id, guest: booking.name, room: booking.room, checkIn: booking.checkIn, checkOut: booking.checkOut });
    try {
      await sendEmail({
        from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
        to: booking.email,
        subject: `🔴 BOOKING NOT APPROVED — ${booking.id}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:28px;background:#f8f3e9;border-radius:18px"><h1 style="color:#9b2c2c">🔴 BOOKING NOT APPROVED</h1><p>Dear ${esc(booking.name)}, your booking request was not approved.</p><p><b>Room:</b> ${esc(booking.room)}<br><b>Stay:</b> ${esc(booking.checkIn)} to ${esc(booking.checkOut)}<br><b>Status:</b> REJECTED</p><p>The requested dates have been released and are available for another request.</p><p>Please contact the resort if you would like help choosing another room or date.</p></div>`,
      });
    } catch (emailError) { console.error("Guest rejection email failed:", emailError); }
    try {
      await sendEmail({
        from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
        to: MANAGER_EMAIL,
        subject: `🔴 BOOKING REJECTED — ${booking.id}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:28px;background:#f8f3e9;border-radius:18px"><h1>🔴 BOOKING REJECTED</h1><p><b>Guest:</b> ${esc(booking.name)}<br><b>Room:</b> ${esc(booking.room)}<br><b>Stay:</b> ${esc(booking.checkIn)} to ${esc(booking.checkOut)}<br><b>Status:</b> REJECTED</p><p>The dates are now free for new bookings.</p></div>`,
      });
    } catch (emailError) { console.error("Manager rejection email failed:", emailError); }
    res.send(`<html><body style="font-family:Arial;padding:40px;background:#f8f3e9;color:#0b1d0a"><div style="max-width:650px;margin:auto;background:white;padding:35px;border-radius:20px;text-align:center"><div style="font-size:55px">🔴</div><h1>BOOKING REJECTED</h1><p>The request for <b>${esc(booking.name)}</b> has been rejected.</p><p><b>Room:</b> ${esc(booking.room)}<br><b>Stay:</b> ${esc(booking.checkIn)} to ${esc(booking.checkOut)}</p><p style="color:#176b20;font-weight:bold">Those dates are now free for new guests.</p></div></body></html>`);
  } catch (error) {
    console.error("Rejection error:", error);
    res.status(500).send(`<html><body style="font-family:Arial;padding:40px"><h1>❌ Could not reject booking</h1><p>${esc(error instanceof Error ? error.message : "Unknown error")}</p></body></html>`);
  }
});


// ============================================================
// SUBSCRIBE
// ============================================================

app.post(
  "/api/subscribe",
  async (req, res) => {
    try {

      const email =
        String(
          req.body?.email || ""
        )
          .trim()
          .toLowerCase();


      if (!isValidEmail(email)) {
        return res.status(400).json({
          message:
            "Please enter a valid email address.",
        });
      }


      const existing =
        await readJsonArray(
          subscribersFile
        );


      const alreadySubscribed =
        existing.some(
          item =>
            String(
              item.email || ""
            ).toLowerCase() ===
            email
        );


      if (!alreadySubscribed) {

        await appendJsonItem(
          subscribersFile,
          {
            id:
              `SUB-${Date.now().toString(36).toUpperCase()}`,

            email,

            subscribedAt:
              new Date().toISOString(),

            source:
              "website",
          }
        );
      }


      const contactUrl =
        `${FRONTEND_URL}/contact-message?email=${encodeURIComponent(email)}`;


      // Email delivery is attempted after the subscription
      // is safely saved.

      let emailSent =
        false;


      try {

        const transport =
          mailer();


        await transport.sendMail({
          from:
            `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,

          to:
            MANAGER_EMAIL,

          subject:
            "New Musanze Dispatch subscriber",

          html:
            `<p>New subscriber: <b>${esc(email)}</b></p>`,
        });


        await transport.sendMail({
          from:
            `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,

          to:
            email,

          subject:
            "Welcome to the Musanze Dispatch",

          html: `
            <h2>
              Welcome to Gorilla Recreational Resort
            </h2>

            <p>
              You are now subscribed for trekking,
              room, and Musanze updates.
            </p>

            <p>
              <a href="${contactUrl}">
                Send a message or comment to our resort team
              </a>
            </p>
          `,
        });


        emailSent =
          true;

      } catch (mailError) {

        console.error(
          "Subscription email delivery error:",
          mailError
        );
      }


      res.json({

        message:
          alreadySubscribed

            ? "You are already subscribed. Your subscription is active."

            : emailSent

              ? "Subscription confirmed. Please check your email."

              : "Subscription confirmed and saved successfully. Email delivery is temporarily unavailable.",

        nextUrl:
          contactUrl,

        saved:
          true,

        emailSent,
      });

    } catch (error) {

      console.error(
        "Subscription error:",
        error
      );

      res.status(500).json({

        message:
          error instanceof Error
            ? error.message
            : "Subscription failed.",
      });
    }
  }
);


// ============================================================
// CONTACT
// ============================================================

app.post(
  "/api/contact",
  async (req, res) => {
    try {

      const {
        name,
        email,
        phone = "",
        message,
      } = req.body;


      if (
        [
          name,
          email,
          message,
        ].every(
          value =>
            String(
              value ?? ""
            ).trim()
        ) === false
      ) {
        return res.status(400).json({
          message:
            "Name, email and message are required.",
        });
      }


      if (!isValidEmail(email)) {
        return res.status(400).json({
          message:
            "Please enter a valid email address.",
        });
      }


      const savedMessage =
        await appendJsonItem(
          messagesFile,
          {
            id:
              `MSG-${Date.now().toString(36).toUpperCase()}`,

            name:
              String(name).trim(),

            email:
              String(email)
                .trim()
                .toLowerCase(),

            phone:
              String(phone).trim(),

            message:
              String(message).trim(),

            createdAt:
              new Date().toISOString(),

            source:
              "website",

            emailSent:
              false,
          }
        );


      let emailSent =
        false;


      try {

        await sendEmail({

          from:
            `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,

          replyTo:
            email,

          to:
            MANAGER_EMAIL,

          subject:
            `Website message from ${name}`,

          html: `
            <h2>
              New guest message
            </h2>

            <p>
              <b>Name:</b>
              ${esc(name)}
            </p>

            <p>
              <b>Email:</b>
              ${esc(email)}
            </p>

            <p>
              <b>Phone:</b>
              ${esc(
                phone ||
                "Not provided"
              )}
            </p>

            <p>
              <b>Message:</b>
            </p>

            <p>
              ${esc(message)}
            </p>

            <p style="
              color:#777;
              font-size:12px
            ">
              Message ID:
              ${esc(savedMessage.id)}
            </p>
          `,
        });


        emailSent =
          true;

        savedMessage.emailSent =
          true;


        // Keep the persistent record accurate
        // after successful delivery.

        const messages =
          await readJsonArray(
            messagesFile
          );


        const index =
          messages.findIndex(
            item =>
              item.id ===
              savedMessage.id
          );


        if (index >= 0) {

          messages[index] =
            savedMessage;


          await fs.writeFile(
            messagesFile,
            JSON.stringify(
              messages,
              null,
              2
            ),
            "utf8"
          );
        }

      } catch (mailError) {

        console.error(
          "Contact email delivery error:",
          mailError
        );
      }


      res.json({

        message:
          emailSent

            ? "Your message/comment was sent successfully to the resort manager."

            : "Your message/comment was saved successfully. Email delivery is temporarily unavailable.",

        messageId:
          savedMessage.id,

        saved:
          true,

        emailSent,
      });

    } catch (error) {

      console.error(
        "Contact error:",
        error
      );

      res.status(500).json({

        message:
          error instanceof Error
            ? error.message
            : "Message could not be sent.",
      });
    }
  }
);


// ============================================================
// MANAGER DASHBOARD / AUTHENTICATION
// ============================================================

app.post("/api/admin/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (email !== MANAGER_LOGIN_EMAIL || !passwordMatches(password)) {
    await appendAudit("manager_login_failed", { email });
    await notifyManagerDashboardAction("Unauthorized manager login attempt", {
      attemptedEmail: email || "No email provided",
      result: "Denied",
    });
    return res.status(401).json({ message: "You are not the manager. Only the authorized manager account can sign in." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { email: MANAGER_LOGIN_EMAIL, expiresAt: Date.now() + SESSION_TTL_MS });
  setSessionCookie(res, token);
  await appendAudit("manager_login", { email: MANAGER_LOGIN_EMAIL });
  await notifyManagerDashboardAction("Manager logged in", {
    managerEmail: MANAGER_LOGIN_EMAIL,
    result: "Successful",
  });
  res.json({ authenticated: true, email: MANAGER_LOGIN_EMAIL });
});

app.post("/api/admin/logout", async (req, res) => {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) sessions.delete(token);
  clearSessionCookie(res);
  await notifyManagerDashboardAction("Manager logged out", {
    managerEmail: MANAGER_LOGIN_EMAIL,
  });
  res.json({ authenticated: false });
});

app.get("/api/admin/me", requireManager, (req, res) => {
  res.json({ authenticated: true, email: req.manager.email });
});

app.get("/api/admin/dashboard", requireManager, async (_req, res) => {
  const data = await readAllAdminData();
  res.json({
    ...data,
    managerEmail: MANAGER_EMAIL,
    rooms: [
      { room: "Room I · MUHABURA", tier: "VIP", nightlyPrice: 350 },
      { room: "Room II · GAHINGA", tier: "Standard", nightlyPrice: 200 },
      { room: "Room III · SABYINYO", tier: "Standard", nightlyPrice: 200 },
      { room: "Room IV · BISOKE", tier: "Standard", nightlyPrice: 200 },
      { room: "Room V · KARISIMBI", tier: "Standard", nightlyPrice: 200 },
    ],
  });
});

app.delete("/api/admin/bookings/:id", requireManager, async (req, res) => {
  const items = await readBookings();
  const index = items.findIndex(item => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: "Booking not found." });
  const [deleted] = items.splice(index, 1);
  await writeBookings(items);
  await appendAudit("booking_deleted", { bookingId: deleted.id, guest: deleted.name, room: deleted.room, checkIn: deleted.checkIn, checkOut: deleted.checkOut, previousStatus: deleted.status });
  void notifyManagerDashboardAction("Booking deleted and dates released", {
    bookingId: deleted.id, guest: deleted.name, guestEmail: deleted.email, room: deleted.room,
    checkIn: deleted.checkIn, checkOut: deleted.checkOut, previousStatus: deleted.status,
  }, `booking-delete:${deleted.id}`);
  void sendEmail({
    from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
    to: deleted.email,
    subject: `Booking update — ${deleted.id}`,
    dedupeKey: `booking-delete-guest:${deleted.id}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:28px;background:#f8f3e9;border-radius:18px"><h1>Booking update</h1><p>Dear ${esc(deleted.name)}, your booking record has been cancelled by the resort manager.</p><p><b>Room:</b> ${esc(deleted.room)}<br><b>Stay:</b> ${esc(deleted.checkIn)} to ${esc(deleted.checkOut)}</p><p>The dates have been released and are available for new requests.</p></div>`,
  }).catch(emailError => console.error("Deleted booking guest email failed:", emailError));
  res.json({ message: "Booking deleted and dates released." });
});

app.delete("/api/admin/messages/:id", requireManager, async (req, res) => {
  const items = await readJsonArray(messagesFile);
  const index = items.findIndex(item => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: "Message not found." });
  const [deleted] = items.splice(index, 1);
  await fs.writeFile(messagesFile, JSON.stringify(items, null, 2), "utf8");
  await appendAudit("message_deleted", { messageId: deleted.id, email: deleted.email, name: deleted.name });
  void notifyManagerDashboardAction("Guest message/comment deleted", {
    messageId: deleted.id, guestName: deleted.name, guestEmail: deleted.email,
  }, `message-delete:${deleted.id}`);
  res.json({ message: "Message deleted." });
});

app.delete("/api/admin/subscribers/:id", requireManager, async (req, res) => {
  const items = await readJsonArray(subscribersFile);
  const index = items.findIndex(item => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: "Subscriber not found." });
  const [deleted] = items.splice(index, 1);
  await fs.writeFile(subscribersFile, JSON.stringify(items, null, 2), "utf8");
  await appendAudit("subscriber_deleted", { subscriberId: deleted.id, email: deleted.email });
  void notifyManagerDashboardAction("Subscriber deleted", {
    subscriberId: deleted.id, subscriberEmail: deleted.email,
  }, `subscriber-delete:${deleted.id}`);
  res.json({ message: "Subscriber deleted." });
});

app.post("/api/admin/forgot-password", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const generic = "If that manager email is registered, a password reset link has been sent.";
  if (email !== MANAGER_LOGIN_EMAIL) {
    await appendAudit("manager_password_reset_failed", { email });
    await notifyManagerDashboardAction("Unauthorized password reset attempt", {
      attemptedEmail: email || "No email provided",
      result: "Denied",
    });
    return res.json({ message: generic });
  }
  const token = crypto.randomBytes(32).toString("hex");
  await fs.writeFile(adminResetFile, JSON.stringify({ token, expiresAt: Date.now() + 30 * 60 * 1000 }, null, 2), "utf8");
  const resetUrl = `${FRONTEND_URL}/manager/reset-password?token=${encodeURIComponent(token)}`;
  await notifyManagerDashboardAction("Manager password reset requested", {
    managerEmail: MANAGER_LOGIN_EMAIL,
    result: "Reset link sent",
  });
  try {
    await sendEmail({
      from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
      to: MANAGER_LOGIN_EMAIL,
      subject: "🔐 Gorilla Resort manager password reset",
      html: `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:28px;background:#f8f3e9;border-radius:18px"><h1>Reset manager password</h1><p>A password reset was requested for the resort manager dashboard.</p><p><a href="${resetUrl}" style="display:inline-block;padding:14px 20px;background:#0b1d0a;color:white;text-decoration:none;border-radius:8px;font-weight:bold">RESET PASSWORD</a></p><p>This link expires in 30 minutes. If you did not request it, ignore this email.</p></div>`,
    });
  } catch (error) { console.error("Reset email failed:", error); }
  res.json({ message: generic });
});

app.post("/api/admin/reset-password", async (req, res) => {
  const token = String(req.body?.token || "");
  const password = String(req.body?.password || "");
  if (password.length < 10) return res.status(400).json({ message: "Choose a password with at least 10 characters." });
  let reset;
  try { reset = JSON.parse(await fs.readFile(adminResetFile, "utf8")); } catch { reset = null; }
  if (!reset || reset.token !== token || reset.expiresAt <= Date.now()) return res.status(400).json({ message: "This reset link is invalid or expired." });
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  managerPasswordHash = hash;
  managerPasswordSalt = salt;
  await fs.mkdir(path.dirname(adminAuthFile), { recursive: true });
  await fs.writeFile(adminAuthFile, JSON.stringify({ email: MANAGER_LOGIN_EMAIL, passwordHash: hash, passwordSalt: salt, updatedAt: new Date().toISOString() }, null, 2), "utf8");
  await fs.writeFile(adminResetFile, JSON.stringify({ usedAt: new Date().toISOString() }, null, 2), "utf8");
  await appendAudit("manager_password_reset", { email: MANAGER_LOGIN_EMAIL });
  await notifyManagerDashboardAction("Manager password changed", {
    managerEmail: MANAGER_LOGIN_EMAIL,
    result: "Successful",
  });
  res.json({ message: "Manager password reset successfully. You can now sign in with the new password." });
});


// ============================================================
// ACTIVITY EXPORTS
// ============================================================

function csvEscape(value = "") {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

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

app.get("/api/admin/export", requireManager, async (req, res) => {
  try {
    const period = String(req.query.period || "weekly");
    const format = String(req.query.format || "xlsx").toLowerCase();
    const selectedDate = String(req.query.date || getKigaliDateString());
    const selectedMonth = String(req.query.month || selectedDate.slice(0, 7));
    const selectedYear = String(req.query.year || selectedDate.slice(0, 4));

    if (!["weekly", "monthly", "yearly", "date"].includes(period)) {
      return res.status(400).json({ message: "Please choose a valid report period." });
    }
    if (!["xlsx", "pdf"].includes(format)) {
      return res.status(400).json({ message: "Please choose Excel or PDF." });
    }

    const dateFromKigali = (value) => new Date(`${value}T00:00:00+02:00`);
    let fromDate;
    let toDate;
    let periodLabel;

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
      fromDate = dateFromKigali(monday);
      toDate = dateFromKigali(followingMonday);
      periodLabel = `Week of ${monday} – ${followingMonday}`;
    } else if (period === "monthly") {
      // The selected month identifies the complete calendar month.
      const [year, month] = selectedMonth.split("-").map(Number);
      if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({ message: "Please choose a valid month." });
      }
      const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextFirstDay = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
      fromDate = dateFromKigali(firstDay);
      toDate = dateFromKigali(nextFirstDay);
      periodLabel = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "Africa/Kigali",
      }).format(fromDate);
    } else if (period === "yearly") {
      const year = Number(selectedYear);
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return res.status(400).json({ message: "Please choose a valid year." });
      }
      fromDate = dateFromKigali(`${year}-01-01`);
      toDate = dateFromKigali(`${year + 1}-01-01`);
      periodLabel = String(year);
    } else {
      if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(selectedDate)) {
        return res.status(400).json({ message: "Please choose a valid date." });
      }
      fromDate = dateFromKigali(selectedDate);
      const [year, month, day] = selectedDate.split("-").map(Number);
      const next = new Date(Date.UTC(year, month - 1, day + 1));
      toDate = dateFromKigali(next.toISOString().slice(0, 10));
      periodLabel = selectedDate;
    }

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate <= fromDate) {
      return res.status(400).json({ message: "Please choose a valid export period." });
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

    // Audit is the source of truth for actions that actually happened, including
    // approvals, rejections and deletions. Other sources add creation/received records.
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

    const matrix = rows.map(row => [
      row.date, row.time, row.source, row.action, row.bookingId, row.guest,
      row.email, row.room, row.checkIn, row.checkOut, row.status,
      row.amount === "" ? "" : Number(row.amount), row.details
    ]);

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

    if (format === "xlsx") {
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
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filenameBase}.xlsx"`
      );
      return res.send(buffer);
    }

    // PDF: landscape A4 with a cover/summary block and a readable activity table.
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30, bufferPages: true });
    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => {
      const pdf = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.pdf"`);
      res.send(pdf);
    });

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
  } catch (error) {
    console.error("Activity export error:", error);
    if (!res.headersSent) res.status(500).json({ message: "Could not export resort activities." });
  }
});


// ============================================================
// START SERVER
// ============================================================

await loadManagerAuth();
scheduleWeeklyReport();

app.listen(
  PORT,
  () => {
    console.log(
      `Gorilla Resort API running on http://localhost:${PORT}`
    );
  }
);