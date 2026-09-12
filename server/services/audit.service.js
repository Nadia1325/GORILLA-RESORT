import crypto from "crypto";
import { prisma } from "../db.js";

export async function appendAudit(action, details = {}) {
  return prisma.auditLog.create({
    data: {
      id: `AUD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex")}`,
      action,
      details,
    },
  });
}
