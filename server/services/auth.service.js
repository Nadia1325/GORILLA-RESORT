import crypto from "crypto";
import { prisma } from "../db.js";
import { MANAGER_LOGIN_EMAIL, SESSION_COOKIE, SESSION_TTL_MS } from "../config/index.js";

let managerPasswordHash = String(process.env.MANAGER_PASSWORD_HASH || "");
let managerPasswordSalt = String(process.env.MANAGER_PASSWORD_SALT || "");

export function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export async function loadManagerAuth() {
  try {
    const saved = await prisma.adminAuth.findUnique({
      where: { email: MANAGER_LOGIN_EMAIL },
    });
    if (saved?.passwordHash && saved?.passwordSalt) {
      managerPasswordHash = saved.passwordHash;
      managerPasswordSalt = saved.passwordSalt;
    }
  } catch (error) {
    // Environment credentials remain the initial source of truth.
    console.error("Could not load manager auth from database:", error.message);
  }
}

export function passwordMatches(password) {
  if (!managerPasswordHash || !managerPasswordSalt) return false;
  const actual = Buffer.from(hashPassword(password, managerPasswordSalt), "hex");
  const expected = Buffer.from(managerPasswordHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// Lets a password reset take effect immediately, without an import re-read.
export function setManagerCredentials(hash, salt) {
  managerPasswordHash = hash;
  managerPasswordSalt = salt;
}

export function parseCookies(req) {
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

export function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`);
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

export async function createManagerSession(email) {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.managerSession.create({
    data: { token, email, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  return token;
}

export async function destroyManagerSession(token) {
  if (!token) return;
  await prisma.managerSession.delete({ where: { token } }).catch(() => {});
}

export async function getManagerSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const session = await prisma.managerSession.findUnique({ where: { token } });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.managerSession.delete({ where: { token } }).catch(() => {});
    return null;
  }
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.managerSession.update({ where: { token }, data: { expiresAt } }).catch(() => {});
  return { email: session.email, expiresAt };
}
