export function getHealth(_req, res) {
  res.json({
    ok: true,
    gmailConfigured: Boolean(
      process.env.GMAIL_USER &&
      process.env.GMAIL_APP_PASSWORD &&
      process.env.GMAIL_APP_PASSWORD !== "your_google_app_password"
    ),
  });
}
