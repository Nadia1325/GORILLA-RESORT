import crypto from "crypto";
import { prisma } from "../db.js";
import { API_PUBLIC_URL, MANAGER_EMAIL } from "../config/index.js";
import { esc, isValidEmail, getKigaliDateString, roomPricing, nightsBetween } from "../utils.js";
import { sendEmail, notifyManagerDashboardAction } from "./mailer.service.js";
import { appendAudit } from "./audit.service.js";
import { httpError } from "../httpError.js";

export async function getUnavailableRooms(checkIn, checkOut) {
  if (!checkIn || !checkOut) return [];

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start ||
    String(checkIn) < getKigaliDateString()
  ) {
    throw httpError(400, "Please choose valid stay dates.");
  }

  const items = await prisma.booking.findMany({
    where: {
      status: { in: ["approved", "confirmed"] },
      checkIn: { lt: String(checkOut) },
      checkOut: { gt: String(checkIn) },
    },
    select: { room: true },
  });

  return [...new Set(items.map((booking) => booking.room))];
}

export async function createBooking(input) {
  const {
    room,
    name,
    email,
    phone,
    location,
    checkIn,
    checkOut,
    guests,
    specialRequests = "",
    packageName = "",
  } = input;

  if (
    ![room, name, email, phone, location, checkIn, checkOut, guests].every(
      (value) => String(value ?? "").trim()
    )
  ) {
    throw httpError(400, "Please complete all required booking fields.");
  }

  if (!isValidEmail(email)) {
    throw httpError(400, "Please enter a valid email address so we can send your booking ticket.");
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
    throw httpError(400, "Please choose valid check-in and check-out dates.");
  }

  if (checkOutDate <= checkInDate) {
    throw httpError(400, "Check-out must be after check-in.");
  }

  if (String(checkIn) < getKigaliDateString()) {
    throw httpError(400, "Check-in must be today or a future date. Earlier dates cannot be booked.");
  }

  const overlapping = await prisma.booking.findFirst({
    where: {
      room,
      status: { in: ["pending", "approved", "confirmed"] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });

  if (overlapping) {
    throw httpError(409, "That room has just been requested for those dates. Please choose another room or different dates.");
  }

  const booking = {
    id: `GRR-${Date.now().toString(36).toUpperCase()}`,
    approvalToken: crypto.randomBytes(24).toString("hex"),
    room,
    name,
    email,
    phone,
    location,
    checkIn,
    checkOut,
    guests,
    specialRequests,
    packageName,
    ...roomPricing(room),
    nights: nightsBetween(checkIn, checkOut),
    totalPrice: roomPricing(room).nightlyPrice * nightsBetween(checkIn, checkOut),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await prisma.booking.create({ data: booking });

  console.log(`Booking saved successfully: ${booking.id}`);
  await appendAudit("booking_created", {
    bookingId: booking.id,
    guest: booking.name,
    room: booking.room,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    totalPrice: booking.totalPrice,
  });

  const approveUrl = `${API_PUBLIC_URL}/api/bookings/${booking.id}/approve?token=${booking.approvalToken}`;
  const rejectUrl = `${API_PUBLIC_URL}/api/bookings/${booking.id}/reject?token=${booking.approvalToken}`;

  // Email is best-effort: a failed send must not undo the saved booking.
  let managerEmailSent = false;
  let guestEmailSent = false;

  try {
    await sendEmail({
      from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
      to: MANAGER_EMAIL,
      subject: `🟡 NEW BOOKING REQUEST — ${booking.id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;background:#f8f3e9;padding:25px;border-radius:18px;">
          <h1 style="color:#b8860b;margin-top:0;">🟡 NEW BOOKING REQUEST</h1>
          <p>A new room booking request has been received.</p>
          <hr>
          <p><b>Guest:</b> ${esc(name)}</p>
          <p><b>Email:</b> ${esc(email)}</p>
          <p><b>Phone:</b> ${esc(phone)}</p>
          <p><b>Location:</b> ${esc(location)}</p>
          <p><b>Room:</b> ${esc(room)}</p>
          <p><b>Stay:</b> ${esc(checkIn)} to ${esc(checkOut)}</p>
          <p><b>Guests:</b> ${esc(guests)}</p>
          <p><b>Package:</b> ${esc(packageName || "Standard stay")}</p>
          <p><b>Requests:</b> ${esc(specialRequests || "None")}</p>
          <p><b>Rate:</b> $${booking.nightlyPrice} / night (${esc(booking.tier)})</p>
          <p><b>Estimated total:</b> $${Number(booking.totalPrice || 0).toLocaleString()}</p>
          <p><b>Status:</b> 🟡 PENDING</p>
          <br>
          <a href="${approveUrl}" style="display:inline-block;padding:15px 25px;background:#168a32;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">🟢 APPROVE BOOKING</a>
          <a href="${rejectUrl}" style="display:inline-block;margin-left:10px;padding:15px 25px;background:#9b2c2c;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">🔴 REJECT BOOKING</a>
          <p style="margin-top:25px;font-size:12px;color:#666;">Clicking the button will confirm this booking and automatically send confirmation emails.</p>
        </div>
      `,
    });
    managerEmailSent = true;
    console.log(`New booking notification sent to ${MANAGER_EMAIL}`);
  } catch (managerEmailError) {
    console.error("Manager booking email failed:", managerEmailError);
  }

  try {
    await sendEmail({
      from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Booking request received — ${booking.id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;">
          <h2>🟡 Booking Request Received</h2>
          <p>Murakaza neza, <b>${esc(name)}</b>.</p>
          <p>We received your booking request for:</p>
          <p><b>${esc(room)}</b></p>
          <p>${esc(checkIn)} to ${esc(checkOut)}</p>
          <p><b>Status:</b> 🟡 PENDING</p>
          <p>Booking ID: <b>${esc(booking.id)}</b></p>
          <p>Our manager will review your request. You will receive another email when your booking is confirmed.</p>
        </div>
      `,
    });
    guestEmailSent = true;
    console.log(`Booking received email sent to ${email}`);
  } catch (guestEmailError) {
    console.error("Guest booking received email failed:", guestEmailError);
  }

  let responseMessage = "Booking request saved successfully.";
  if (managerEmailSent && guestEmailSent) {
    responseMessage = "Booking request sent successfully. Please check your email for confirmation.";
  } else if (managerEmailSent && !guestEmailSent) {
    responseMessage = "Booking request saved successfully. The resort manager has been notified, but the guest confirmation email could not be delivered right now.";
  } else if (!managerEmailSent && guestEmailSent) {
    responseMessage = "Booking request saved successfully. Your confirmation email was sent, but the resort manager notification could not be delivered right now.";
  } else {
    responseMessage = "Booking request saved successfully. Email delivery is temporarily unavailable.";
  }

  return {
    message: responseMessage,
    bookingId: booking.id,
    saved: true,
    emailSent: managerEmailSent && guestEmailSent,
    managerEmailSent,
    guestEmailSent,
  };
}

async function findBookingByToken(id, token) {
  const found = await prisma.booking.findUnique({ where: { id } });
  return found && found.approvalToken === token ? found : null;
}

export async function approveBooking(id, token) {
  const booking = await findBookingByToken(id, token);
  if (!booking) return { outcome: "invalid" };
  if (booking.status === "confirmed") return { outcome: "already-confirmed", booking };

  const approvedAt = new Date();
  booking.status = "confirmed";
  booking.approvedAt = approvedAt.toISOString();
  booking.confirmedAt = approvedAt.toISOString();

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "confirmed", approvedAt, confirmedAt: approvedAt },
  });
  await appendAudit("booking_confirmed", {
    bookingId: booking.id,
    guest: booking.name,
    room: booking.room,
    totalPrice: booking.totalPrice,
  });

  try {
    await sendEmail({
      from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
      to: booking.email,
      subject: `🟢 BOOKING CONFIRMED — ${booking.id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;background:#f8f3e9;border-radius:18px;overflow:hidden;border:1px solid #d9be72;">
          <div style="background:#0B1D0A;color:white;padding:28px;">
            <h1 style="margin:0">🟢 BOOKING CONFIRMED</h1>
            <p>Gorilla Recreational Resort</p>
          </div>
          <div style="padding:28px">
            <h2>Murakaza neza, ${esc(booking.name)}!</h2>
            <p>Your booking has been successfully confirmed.</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0"><b>Guest</b></td><td style="padding:10px 0">${esc(booking.name)}</td></tr>
              <tr><td style="padding:10px 0"><b>Room</b></td><td style="padding:10px 0">${esc(booking.room)}</td></tr>
              <tr><td style="padding:10px 0"><b>Stay</b></td><td style="padding:10px 0">${esc(booking.checkIn)} to ${esc(booking.checkOut)}</td></tr>
              <tr><td style="padding:10px 0"><b>Guests</b></td><td style="padding:10px 0">${esc(booking.guests)}</td></tr>
              <tr><td style="padding:10px 0"><b>Rate</b></td><td style="padding:10px 0">$${booking.nightlyPrice} / night (${esc(booking.tier)}) · Total $${Number(booking.totalPrice || 0).toLocaleString()}</td></tr>
              <tr><td style="padding:10px 0"><b>Booking ID</b></td><td style="padding:10px 0">${esc(booking.id)}</td></tr>
              <tr><td style="padding:10px 0"><b>Status</b></td><td style="padding:10px 0;font-size:18px;font-weight:bold;">🟢 CONFIRMED ✓</td></tr>
            </table>
            <p style="margin-top:25px;">Please keep this email as your booking confirmation.</p>
          </div>
        </div>
      `,
    });
    console.log(`Guest confirmation sent to ${booking.email}`);
  } catch (guestEmailError) {
    console.error("Guest confirmation email failed:", guestEmailError);
  }

  const approvedTime = approvedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Kigali" });
  const approvedDate = approvedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Africa/Kigali" });

  try {
    await sendEmail({
      from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
      to: MANAGER_EMAIL,
      subject: `🟢 BOOKING CONFIRMED — ${booking.id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;background:#f8f3e9;border-radius:18px;overflow:hidden;border:1px solid #d9be72;">
          <div style="background:#0B1D0A;color:white;padding:28px;">
            <h1 style="margin:0;font-size:28px;">🟢 BOOKING CONFIRMED</h1>
            <p style="margin:10px 0 0;">Gorilla Recreational Resort</p>
          </div>
          <div style="padding:28px">
            <h2>Booking successfully approved</h2>
            <p>The manager approval button was clicked successfully.</p>
            <hr>
            <p><b>Guest:</b> ${esc(booking.name)}</p>
            <p><b>Email:</b> ${esc(booking.email)}</p>
            <p><b>Phone:</b> ${esc(booking.phone)}</p>
            <p><b>Location:</b> ${esc(booking.location)}</p>
            <p><b>Room:</b> ${esc(booking.room)}</p>
            <p><b>Stay:</b> ${esc(booking.checkIn)} to ${esc(booking.checkOut)}</p>
            <p><b>Guests:</b> ${esc(booking.guests)}</p>
            <p><b>Package:</b> ${esc(booking.packageName || "Standard stay")}</p>
            <p><b>Requests:</b> ${esc(booking.specialRequests || "None")}</p>
            <p><b>Rate:</b> $${booking.nightlyPrice} / night (${esc(booking.tier)}) · Total $${Number(booking.totalPrice || 0).toLocaleString()}</p>
            <div style="margin-top:30px;padding:22px;background:#e9f6e7;border:1px solid #a8d5a2;border-radius:12px;">
              <div style="font-size:24px;font-weight:bold;color:#176b20;">🟢 BOOKING CONFIRMED</div>
              <p style="font-size:18px;font-weight:bold;margin-bottom:8px;">Status: CONFIRMED ✓</p>
              <p style="margin:6px 0;">Approved at: <b>${approvedTime}</b></p>
              <p style="margin:6px 0;">${approvedDate}</p>
            </div>
            <div style="margin-top:25px;padding:18px;background:white;border-radius:10px;border:1px solid #ddd;"><b>Booking ID:</b> ${esc(booking.id)}</div>
            <p style="margin-top:25px;color:#555;">A confirmation email has also been sent to the guest.</p>
          </div>
        </div>
      `,
    });
    console.log(`Manager confirmation sent to ${MANAGER_EMAIL}`);
  } catch (managerEmailError) {
    console.error("Manager confirmation email failed:", managerEmailError);
  }

  return { outcome: "confirmed", booking, approvedTime };
}

export async function rejectBooking(id, token) {
  const booking = await findBookingByToken(id, token);
  if (!booking) return { outcome: "invalid" };
  if (booking.status === "rejected") return { outcome: "already-rejected", booking };
  if (booking.status === "confirmed" || booking.status === "approved") return { outcome: "already-confirmed", booking };

  booking.status = "rejected";
  booking.rejectedAt = new Date().toISOString();
  booking.rejectionReason = "Rejected by resort manager";

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "rejected", rejectedAt: new Date(booking.rejectedAt), rejectionReason: booking.rejectionReason },
  });
  await appendAudit("booking_rejected", {
    bookingId: booking.id,
    guest: booking.name,
    room: booking.room,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
  });

  try {
    await sendEmail({
      from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
      to: booking.email,
      subject: `🔴 BOOKING NOT APPROVED — ${booking.id}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:28px;background:#f8f3e9;border-radius:18px"><h1 style="color:#9b2c2c">🔴 BOOKING NOT APPROVED</h1><p>Dear ${esc(booking.name)}, your booking request was not approved.</p><p><b>Room:</b> ${esc(booking.room)}<br><b>Stay:</b> ${esc(booking.checkIn)} to ${esc(booking.checkOut)}<br><b>Status:</b> REJECTED</p><p>The requested dates have been released and are available for another request.</p><p>Please contact the resort if you would like help choosing another room or date.</p></div>`,
    });
  } catch (emailError) {
    console.error("Guest rejection email failed:", emailError);
  }

  try {
    await sendEmail({
      from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
      to: MANAGER_EMAIL,
      subject: `🔴 BOOKING REJECTED — ${booking.id}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:28px;background:#f8f3e9;border-radius:18px"><h1>🔴 BOOKING REJECTED</h1><p><b>Guest:</b> ${esc(booking.name)}<br><b>Room:</b> ${esc(booking.room)}<br><b>Stay:</b> ${esc(booking.checkIn)} to ${esc(booking.checkOut)}<br><b>Status:</b> REJECTED</p><p>The dates are now free for new bookings.</p></div>`,
    });
  } catch (emailError) {
    console.error("Manager rejection email failed:", emailError);
  }

  return { outcome: "rejected", booking };
}

export async function deleteBooking(id) {
  const deleted = await prisma.booking.findUnique({ where: { id } });
  if (!deleted) throw httpError(404, "Booking not found.");

  await prisma.booking.delete({ where: { id: deleted.id } });
  await appendAudit("booking_deleted", {
    bookingId: deleted.id,
    guest: deleted.name,
    room: deleted.room,
    checkIn: deleted.checkIn,
    checkOut: deleted.checkOut,
    previousStatus: deleted.status,
  });
  void notifyManagerDashboardAction("Booking deleted and dates released", {
    bookingId: deleted.id, guest: deleted.name, guestEmail: deleted.email, room: deleted.room,
    checkIn: deleted.checkIn, checkOut: deleted.checkOut, previousStatus: deleted.status,
  }, `booking-delete:${deleted.id}`);
  void sendEmail({
    from: `Gorilla Recreational Resort <${process.env.GMAIL_USER}>`,
    to: deleted.email,
    subject: `Booking update — ${deleted.id}`,
    dedupeKey: `booking-delete-guest:${deleted.id}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:28px;background:#f8f3e9;border-radius:18px"><h1>Booking update</h1><p>Dear ${esc(deleted.name)}, your booking record has been cancelled by the resort manager.</p><p><b>Room:</b> ${esc(deleted.room)}<br><b>Stay:</b> ${esc(deleted.checkIn)} to ${esc(deleted.checkOut)}</p><p>The dates have been released and are available for new requests.</p></div>`,
  }).catch(emailError => console.error("Deleted booking guest email failed:", emailError));

  return deleted;
}
