import { Router } from "express";
import { requireManager } from "../middleware/requireManager.js";
import { getExport } from "../controllers/export.controller.js";

const router = Router();

router.get("/export", requireManager, getExport);

export default router;
