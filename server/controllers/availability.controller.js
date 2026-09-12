import { getUnavailableRooms } from "../services/booking.service.js";

export async function getAvailability(req, res) {
  try {
    const { checkIn, checkOut } = req.query;
    const unavailable = await getUnavailableRooms(checkIn, checkOut);
    res.json({ unavailable });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Availability error:", error);
    res.status(500).json({ message: "Could not check room availability." });
  }
}
