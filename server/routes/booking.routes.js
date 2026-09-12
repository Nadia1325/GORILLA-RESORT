import { Router } from "express";
import { postBooking, getApproveBooking, getRejectBooking } from "../controllers/booking.controller.js";
import { formLimiter } from "../middleware/rateLimit.js";
import { validateBody } from "../middleware/validateBody.js";
import { createBookingSchema } from "../validation/booking.schema.js";

const router = Router();

router.post("/bookings", formLimiter, validateBody(createBookingSchema), postBooking);
router.get("/bookings/:id/approve", getApproveBooking);
router.get("/bookings/:id/reject", getRejectBooking);

export default router;
