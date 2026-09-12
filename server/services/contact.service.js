import { prisma } from "../db.js";
import { MANAGER_EMAIL } from "../config/index.js";
import { esc, isValidEmail } from "../utils.js";
import { sendEmail } from "./mailer.service.js";
import { httpError } from "../httpError.js";

export async function submitContactMessage({ name, email, phone = "", message }) {
  if (![name, email, message].every((value) => String(value ?? "").trim())) {
    throw httpError(400, "Name, email and message are required.");
  }

  if (!isValidEmail(email)) {
    throw httpError(400, "Please enter a valid email address.");
  }

  const savedMessage = await prisma.message.create({
    data: {
      id: `MSG-${Date.now().toString(36).toUpperCase()}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      message: String(message).trim(),
      source: "website",
      emailSent: false,
    },
  });

  let emailSent = false;
  try {
    await sendEmail({
      from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
      replyTo: email,
      to: MANAGER_EMAIL,
      subject: `Website message from ${name}`,
      html: `
        <h2>New guest message</h2>
        <p><b>Name:</b> ${esc(name)}</p>
        <p><b>Email:</b> ${esc(email)}</p>
        <p><b>Phone:</b> ${esc(phone || "Not provided")}</p>
        <p><b>Message:</b></p>
        <p>${esc(message)}</p>
        <p style="color:#777;font-size:12px">Message ID: ${esc(savedMessage.id)}</p>
      `,
    });

    emailSent = true;

    // Keep the persistent record accurate after successful delivery.
    await prisma.message.update({
      where: { id: savedMessage.id },
      data: { emailSent: true },
    });
  } catch (mailError) {
    console.error("Contact email delivery error:", mailError);
  }

  return {
    message: emailSent
      ? "Your message/comment was sent successfully to the resort manager."
      : "Your message/comment was saved successfully. Email delivery is temporarily unavailable.",
    messageId: savedMessage.id,
    saved: true,
    emailSent,
  };
}
