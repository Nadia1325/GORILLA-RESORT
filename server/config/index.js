import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT || 5000);

export const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

export const API_PUBLIC_URL =
  process.env.API_PUBLIC_URL || `http://localhost:${PORT}`;

export const MANAGER_EMAIL =
  process.env.MANAGER_EMAIL || "resortgorilla@gmail.com";

export const MANAGER_LOGIN_EMAIL =
  String(process.env.MANAGER_LOGIN_EMAIL || MANAGER_EMAIL).trim().toLowerCase();

export const SESSION_COOKIE = "grr_manager_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
