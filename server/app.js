import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { FRONTEND_URL } from "./config/index.js";
import { mailer } from "./services/mailer.service.js";
import { loadManagerAuth } from "./services/auth.service.js";
import apiRoutes from "./routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// CSP is off: the site loads photos directly from Pexels, and a default-src
// 'self' policy would silently break every image. The rest of Helmet's
// headers (clickjacking, MIME-sniffing, etc.) still apply.
app.use(helmet({ contentSecurityPolicy: false }));

// Allow the configured frontend plus any localhost port in dev; block everything else.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowed = new Set([
        FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
      ]);

      if (allowed.has(origin)) return callback(null, true);

      if (process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS blocked this frontend origin."));
    },
  })
);
app.use(express.json());

app.use("/api", apiRoutes);

// Single-deployment mode: this same process also serves the built frontend,
// falling back to index.html for client-side routes.
const distDir = path.join(__dirname, "..", "dist");
app.use(express.static(distDir));
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

// Runs once per process (or per cold start on a serverless platform),
// whether this module is booted via server/index.js or api/[...path].js.
if (
  process.env.GMAIL_USER &&
  process.env.GMAIL_APP_PASSWORD &&
  process.env.GMAIL_APP_PASSWORD !== "your_google_app_password"
) {
  mailer()
    .verify()
    .then(() => console.log("Gmail connection verified successfully."))
    .catch((error) => console.error("Gmail connection check failed:", error.message));
} else {
  console.warn("Gmail is not configured yet. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env before testing email forms.");
}

await loadManagerAuth();

export default app;
