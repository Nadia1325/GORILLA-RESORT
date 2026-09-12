import { Router } from "express";
import { postSubscribe } from "../controllers/subscribe.controller.js";
import { formLimiter } from "../middleware/rateLimit.js";
import { validateBody } from "../middleware/validateBody.js";
import { subscribeSchema } from "../validation/subscribe.schema.js";

const router = Router();

router.post("/subscribe", formLimiter, validateBody(subscribeSchema), postSubscribe);

export default router;
