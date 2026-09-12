import { z } from "zod";
import { isValidEmail } from "../utils.js";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name, email and message are required.").max(200),
  email: z.string().trim().max(200).refine(isValidEmail, "Please enter a valid email address."),
  phone: z.string().trim().max(50).optional().default(""),
  message: z.string().trim().min(1, "Name, email and message are required.").max(2000, "Message is limited to 2000 characters."),
});
