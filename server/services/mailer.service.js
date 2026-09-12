import nodemailer from "nodemailer";
import crypto from "crypto";
import { prisma } from "../db.js";
import { MANAGER_EMAIL } from "../config/index.js";
import { esc } from "../utils.js";

export function mailer() {
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

export async function sendEmail(options) {
  const dedupeKey = String(options.dedupeKey || "").trim();
  if (dedupeKey) {
    const already = await prisma.notificationDedupe.findUnique({ where: { key: dedupeKey } });
    if (already) return { messageId: "", skippedDuplicate: true };
  }

  const result = await mailer().sendMail(options);
  try {
    await prisma.emailLog.create({
      data: {
        id: `EML-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex")}`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject || "",
        messageId: result.messageId || "",
        dedupeKey: dedupeKey || null,
      },
    });
    if (dedupeKey) {
      await prisma.notificationDedupe.create({ data: { key: dedupeKey } });
    }
  } catch (logError) {
    console.error("Email log error:", logError);
  }
  return result;
}

export async function notifyManagerDashboardAction(action, details = {}, dedupeKey = "") {
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
