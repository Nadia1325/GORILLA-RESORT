import { z } from "zod";
import { isValidEmail } from "../utils.js";

export const subscribeSchema = z.object({
  email: z.string().trim().max(200).refine(isValidEmail, "Please enter a valid email address."),
});
