import rateLimit from "express-rate-limit";

// Tighter limit for auth-sensitive endpoints (login, password reset) to
// slow down brute-force / credential-stuffing attempts.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

// Looser limit for public form submissions, to blunt spam without
// bothering a genuine guest who retries a couple of times.
export const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this device. Please try again later." },
});
