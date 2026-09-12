import { Router } from "express";
import { requireManager } from "../middleware/requireManager.js";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  postLogin,
  postLogout,
  getMe,
  getDashboard,
  deleteBookingHandler,
  deleteMessageHandler,
  deleteSubscriberHandler,
  postForgotPassword,
  postResetPassword,
} from "../controllers/admin.controller.js";

const router = Router();

router.post("/login", authLimiter, postLogin);
router.post("/logout", postLogout);
router.get("/me", requireManager, getMe);
router.get("/dashboard", requireManager, getDashboard);
router.delete("/bookings/:id", requireManager, deleteBookingHandler);
router.delete("/messages/:id", requireManager, deleteMessageHandler);
router.delete("/subscribers/:id", requireManager, deleteSubscriberHandler);
router.post("/forgot-password", authLimiter, postForgotPassword);
router.post("/reset-password", authLimiter, postResetPassword);

export default router;
