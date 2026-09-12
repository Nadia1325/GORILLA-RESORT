import { prisma } from "../db.js";
import { FRONTEND_URL, MANAGER_EMAIL } from "../config/index.js";
import { esc, isValidEmail } from "../utils.js";
import { mailer } from "./mailer.service.js";
import { httpError } from "../httpError.js";

export async function subscribeEmail(rawEmail) {
  const email = String(rawEmail || "").trim().toLowerCase();

  if (!isValidEmail(email)) {
    throw httpError(400, "Please enter a valid email address.");
  }

  const existing = await prisma.subscriber.findUnique({ where: { email } });
  const alreadySubscribed = Boolean(existing);

  if (!alreadySubscribed) {
    await prisma.subscriber.create({
      data: {
        id: `SUB-${Date.now().toString(36).toUpperCase()}`,
        email,
        source: "website",
      },
    });
  }

  const contactUrl = `${FRONTEND_URL}/contact-message?email=${encodeURIComponent(email)}`;

  // Email delivery is attempted after the subscription is safely saved.
  let emailSent = false;
  try {
    const transport = mailer();

    await transport.sendMail({
      from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
      to: MANAGER_EMAIL,
      subject: "New Musanze Dispatch subscriber",
      html: `<p>New subscriber: <b>${esc(email)}</b></p>`,
    });

    await transport.sendMail({
      from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Welcome to the Musanze Dispatch",
      html: `
        <h2>Welcome to Gorilla Recreational Resort</h2>
        <p>You are now subscribed for trekking, room, and Musanze updates.</p>
        <p><a href="${contactUrl}">Send a message or comment to our resort team</a></p>
      `,
    });

    emailSent = true;
  } catch (mailError) {
    console.error("Subscription email delivery error:", mailError);
  }

  return {
    message: alreadySubscribed
      ? "You are already subscribed. Your subscription is active."
      : emailSent
        ? "Subscription confirmed. Please check your email."
        : "Subscription confirmed and saved successfully. Email delivery is temporarily unavailable.",
    nextUrl: contactUrl,
    saved: true,
    emailSent,
  };
}
