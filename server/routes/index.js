import { Router } from "express";
import healthRoutes from "./health.routes.js";
import availabilityRoutes from "./availability.routes.js";
import bookingRoutes from "./booking.routes.js";
import subscribeRoutes from "./subscribe.routes.js";
import contactRoutes from "./contact.routes.js";
import adminRoutes from "./admin.routes.js";
import exportRoutes from "./export.routes.js";

const router = Router();

router.use(healthRoutes);
router.use(availabilityRoutes);
router.use(bookingRoutes);
router.use(subscribeRoutes);
router.use(contactRoutes);
router.use("/admin", adminRoutes);
router.use("/admin", exportRoutes);

export default router;
