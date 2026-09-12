import { MANAGER_EMAIL, MANAGER_LOGIN_EMAIL, SESSION_COOKIE } from "../config/index.js";
import { parseCookies, setSessionCookie, clearSessionCookie } from "../services/auth.service.js";
import { readAllAdminData } from "../services/dashboard.service.js";
import { deleteBooking } from "../services/booking.service.js";
import * as adminService from "../services/admin.service.js";

function sendServiceError(res, error, fallbackMessage) {
  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(fallbackMessage, error);
  res.status(500).json({ message: fallbackMessage });
}

export async function postLogin(req, res) {
  try {
    const token = await adminService.login(req.body?.email, req.body?.password);
    setSessionCookie(res, token);
    res.json({ authenticated: true, email: MANAGER_LOGIN_EMAIL });
  } catch (error) {
    sendServiceError(res, error, "Manager login failed.");
  }
}

export async function postLogout(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  await adminService.logout(token);
  clearSessionCookie(res);
  res.json({ authenticated: false });
}

export function getMe(req, res) {
  res.json({ authenticated: true, email: req.manager.email });
}

export async function getDashboard(_req, res) {
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
}

export async function deleteBookingHandler(req, res) {
  try {
    await deleteBooking(req.params.id);
    res.json({ message: "Booking deleted and dates released." });
  } catch (error) {
    sendServiceError(res, error, "Could not delete booking.");
  }
}

export async function deleteMessageHandler(req, res) {
  try {
    await adminService.deleteMessage(req.params.id);
    res.json({ message: "Message deleted." });
  } catch (error) {
    sendServiceError(res, error, "Could not delete message.");
  }
}

export async function deleteSubscriberHandler(req, res) {
  try {
    await adminService.deleteSubscriber(req.params.id);
    res.json({ message: "Subscriber deleted." });
  } catch (error) {
    sendServiceError(res, error, "Could not delete subscriber.");
  }
}

export async function postForgotPassword(req, res) {
  const message = await adminService.requestPasswordReset(req.body?.email);
  res.json({ message });
}

export async function postResetPassword(req, res) {
  try {
    await adminService.resetPassword(String(req.body?.token || ""), String(req.body?.password || ""));
    res.json({ message: "Manager password reset successfully. You can now sign in with the new password." });
  } catch (error) {
    sendServiceError(res, error, "Could not reset password.");
  }
}
