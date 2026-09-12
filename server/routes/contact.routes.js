import { Router } from "express";
import { postContact } from "../controllers/contact.controller.js";
import { formLimiter } from "../middleware/rateLimit.js";
import { validateBody } from "../middleware/validateBody.js";
import { contactSchema } from "../validation/contact.schema.js";

const router = Router();

router.post("/contact", formLimiter, validateBody(contactSchema), postContact);

export default router;
