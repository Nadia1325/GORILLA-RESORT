import { z } from "zod";
import { isValidEmail } from "../utils.js";

export const createBookingSchema = z.object({
  room: z.string().trim().min(1, "Please complete all required booking fields.").max(120),
  name: z.string().trim().min(1, "Please complete all required booking fields.").max(200),
  email: z.string().trim().max(200).refine(isValidEmail, "Please enter a valid email address so we can send your booking ticket."),
  phone: z.string().trim().min(1, "Please complete all required booking fields.").max(50),
  location: z.string().trim().min(1, "Please complete all required booking fields.").max(200),
  checkIn: z.string().trim().min(1, "Please complete all required booking fields.").max(20),
  checkOut: z.string().trim().min(1, "Please complete all required booking fields.").max(20),
  guests: z.string().trim().min(1, "Please complete all required booking fields.").max(50, "Guest details are limited to 50 characters."),
  specialRequests: z.string().trim().max(1000, "Special requests are limited to 1000 characters.").optional().default(""),
  packageName: z.string().trim().max(200).optional().default(""),
});
