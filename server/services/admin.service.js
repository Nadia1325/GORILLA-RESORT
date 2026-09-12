import crypto from "crypto";
import { prisma } from "../db.js";
import { FRONTEND_URL, MANAGER_LOGIN_EMAIL } from "../config/index.js";
import { httpError } from "../httpError.js";
import { sendEmail, notifyManagerDashboardAction } from "./mailer.service.js";
import { appendAudit } from "./audit.service.js";
import {
  passwordMatches,
  hashPassword,
  setManagerCredentials,
  createManagerSession,
  destroyManagerSession,
} from "./auth.service.js";

export async function login(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (normalizedEmail !== MANAGER_LOGIN_EMAIL || !passwordMatches(password)) {
    await appendAudit("manager_login_failed", { email: normalizedEmail });
    await notifyManagerDashboardAction("Unauthorized manager login attempt", {
      attemptedEmail: normalizedEmail || "No email provided",
      result: "Denied",
    });
    throw httpError(401, "You are not the manager. Only the authorized manager account can sign in.");
  }

  const token = await createManagerSession(MANAGER_LOGIN_EMAIL);
  await appendAudit("manager_login", { email: MANAGER_LOGIN_EMAIL });
  await notifyManagerDashboardAction("Manager logged in", {
    managerEmail: MANAGER_LOGIN_EMAIL,
    result: "Successful",
  });

  return token;
}

export async function logout(token) {
  await destroyManagerSession(token);
  await notifyManagerDashboardAction("Manager logged out", {
    managerEmail: MANAGER_LOGIN_EMAIL,
  });
}

export async function deleteMessage(id) {
  const deleted = await prisma.message.findUnique({ where: { id } });
  if (!deleted) throw httpError(404, "Message not found.");

  await prisma.message.delete({ where: { id: deleted.id } });
  await appendAudit("message_deleted", { messageId: deleted.id, email: deleted.email, name: deleted.name });
  void notifyManagerDashboardAction("Guest message/comment deleted", {
    messageId: deleted.id, guestName: deleted.name, guestEmail: deleted.email,
  }, `message-delete:${deleted.id}`);

  return deleted;
}

export async function deleteSubscriber(id) {
  const deleted = await prisma.subscriber.findUnique({ where: { id } });
  if (!deleted) throw httpError(404, "Subscriber not found.");

  await prisma.subscriber.delete({ where: { id: deleted.id } });
  await appendAudit("subscriber_deleted", { subscriberId: deleted.id, email: deleted.email });
  void notifyManagerDashboardAction("Subscriber deleted", {
    subscriberId: deleted.id, subscriberEmail: deleted.email,
  }, `subscriber-delete:${deleted.id}`);

  return deleted;
}

const GENERIC_RESET_MESSAGE = "If that manager email is registered, a password reset link has been sent.";

export async function requestPasswordReset(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (normalizedEmail !== MANAGER_LOGIN_EMAIL) {
    await appendAudit("manager_password_reset_failed", { email: normalizedEmail });
    await notifyManagerDashboardAction("Unauthorized password reset attempt", {
      attemptedEmail: normalizedEmail || "No email provided",
      result: "Denied",
    });
    return GENERIC_RESET_MESSAGE;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await prisma.adminReset.upsert({
    where: { id: 1 },
    create: { id: 1, token, expiresAt },
    update: { token, expiresAt, usedAt: null },
  });

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
  } catch (error) {
    console.error("Reset email failed:", error);
  }

  return GENERIC_RESET_MESSAGE;
}

export async function resetPassword(token, password) {
  if (password.length < 10) {
    throw httpError(400, "Choose a password with at least 10 characters.");
  }

  let reset;
  try {
    reset = await prisma.adminReset.findUnique({ where: { id: 1 } });
  } catch {
    reset = null;
  }

  if (!reset || reset.usedAt || reset.token !== token || reset.expiresAt <= new Date()) {
    throw httpError(400, "This reset link is invalid or expired.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  setManagerCredentials(hash, salt);

  await prisma.adminAuth.upsert({
    where: { email: MANAGER_LOGIN_EMAIL },
    create: { email: MANAGER_LOGIN_EMAIL, passwordHash: hash, passwordSalt: salt },
    update: { passwordHash: hash, passwordSalt: salt },
  });
  await prisma.adminReset.update({ where: { id: 1 }, data: { usedAt: new Date() } });
  await appendAudit("manager_password_reset", { email: MANAGER_LOGIN_EMAIL });
  await notifyManagerDashboardAction("Manager password changed", {
    managerEmail: MANAGER_LOGIN_EMAIL,
    result: "Successful",
  });
}
