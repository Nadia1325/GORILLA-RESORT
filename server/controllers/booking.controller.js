import { esc } from "../utils.js";
import { createBooking, approveBooking, rejectBooking } from "../services/booking.service.js";

export async function postBooking(req, res) {
  try {
    const result = await createBooking(req.body);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Booking creation error:", error);
    return res.status(error.status || 500).json({
      message: error instanceof Error ? error.message : "Could not send booking request.",
    });
  }
}

export async function getApproveBooking(req, res) {
  try {
    const result = await approveBooking(req.params.id, req.query.token);

    if (result.outcome === "invalid") {
      return res.status(404).send(`
        <html><head><title>Invalid Approval Link</title></head>
        <body style="font-family:Arial;padding:40px;background:#f8f3e9;">
          <h1>❌ Invalid approval link</h1>
          <p>This booking approval link is invalid or expired.</p>
        </body></html>
      `);
    }

    if (result.outcome === "already-confirmed") {
      const { booking } = result;
      return res.send(`
        <html><head><title>Booking Already Confirmed</title></head>
        <body style="font-family:Arial;padding:40px;background:#f8f3e9;color:#0b1d0a;">
          <div style="max-width:650px;margin:auto;background:white;padding:35px;border-radius:20px;text-align:center;">
            <div style="font-size:55px;">🟢</div>
            <h1>BOOKING ALREADY CONFIRMED</h1>
            <p><b>Guest:</b> ${esc(booking.name)}</p>
            <p><b>Room:</b> ${esc(booking.room)}</p>
            <p><b>Status:</b> 🟢 CONFIRMED ✓</p>
            <p>This booking has already been confirmed.</p>
          </div>
        </body></html>
      `);
    }

    const { booking, approvedTime } = result;
    res.send(`
      <html><head><title>Booking Confirmed</title></head>
      <body style="margin:0;padding:40px;background:#f8f3e9;font-family:Arial,sans-serif;color:#0B1D0A;">
        <div style="max-width:650px;margin:auto;background:white;padding:35px;border-radius:20px;box-shadow:0 5px 25px rgba(0,0,0,.12);text-align:center;">
          <div style="font-size:60px;">🟢</div>
          <h1>BOOKING CONFIRMED ✓</h1>
          <p style="font-size:18px;">The booking for <b>${esc(booking.name)}</b> has been confirmed.</p>
          <div style="margin:25px 0;padding:20px;background:#e9f6e7;border-radius:12px;text-align:left;">
            <p><b>Guest:</b> ${esc(booking.name)}</p>
            <p><b>Room:</b> ${esc(booking.room)}</p>
            <p><b>Stay:</b> ${esc(booking.checkIn)} to ${esc(booking.checkOut)}</p>
            <p><b>Status:</b> 🟢 CONFIRMED ✓</p>
            <p><b>Approved at:</b> ${approvedTime}</p>
            <p><b>Booking ID:</b> ${esc(booking.id)}</p>
          </div>
          <p>Confirmation emails have been sent to the guest and manager.</p>
        </div>
      </body></html>
    `);
  } catch (error) {
    console.error("Approval error:", error);
    res.status(500).send(`
      <html><body style="font-family:Arial;padding:40px;">
        <h1>❌ Could not confirm booking</h1>
        <p>${esc(error instanceof Error ? error.message : "Unknown error")}</p>
      </body></html>
    `);
  }
}

export async function getRejectBooking(req, res) {
  try {
    const result = await rejectBooking(req.params.id, req.query.token);

    if (result.outcome === "invalid") {
      return res.status(404).send(`<html><body style="font-family:Arial;padding:40px"><h1>❌ Invalid rejection link</h1><p>This booking action link is invalid or expired.</p></body></html>`);
    }

    if (result.outcome === "already-rejected") {
      const { booking } = result;
      return res.send(`<html><body style="font-family:Arial;padding:40px;background:#f8f3e9"><div style="max-width:650px;margin:auto;background:white;padding:35px;border-radius:20px"><h1>🔴 BOOKING ALREADY REJECTED</h1><p><b>Guest:</b> ${esc(booking.name)}</p><p><b>Room:</b> ${esc(booking.room)}</p><p>The dates are available again for new requests.</p></div></body></html>`);
    }

    if (result.outcome === "already-confirmed") {
      return res.status(409).send(`<html><body style="font-family:Arial;padding:40px"><h1>⚠️ Booking already confirmed</h1><p>This booking cannot be rejected because it is already confirmed.</p></body></html>`);
    }

    const { booking } = result;
    res.send(`<html><body style="font-family:Arial;padding:40px;background:#f8f3e9;color:#0b1d0a"><div style="max-width:650px;margin:auto;background:white;padding:35px;border-radius:20px;text-align:center"><div style="font-size:55px">🔴</div><h1>BOOKING REJECTED</h1><p>The request for <b>${esc(booking.name)}</b> has been rejected.</p><p><b>Room:</b> ${esc(booking.room)}<br><b>Stay:</b> ${esc(booking.checkIn)} to ${esc(booking.checkOut)}</p><p style="color:#176b20;font-weight:bold">Those dates are now free for new guests.</p></div></body></html>`);
  } catch (error) {
    console.error("Rejection error:", error);
    res.status(500).send(`<html><body style="font-family:Arial;padding:40px"><h1>❌ Could not reject booking</h1><p>${esc(error instanceof Error ? error.message : "Unknown error")}</p></body></html>`);
  }
}
