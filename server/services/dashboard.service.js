import { prisma } from "../db.js";

export async function readBookings() {
  return prisma.booking.findMany({ orderBy: { createdAt: "desc" } });
}

export async function readAllAdminData() {
  const [bookings, messages, subscribers, audit, emails] = await Promise.all([
    readBookings(),
    prisma.message.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.subscriber.findMany({ orderBy: { subscribedAt: "desc" } }),
    prisma.auditLog.findMany({ orderBy: { at: "desc" } }),
    prisma.emailLog.findMany({ orderBy: { at: "desc" } }),
  ]);
  return { bookings, messages, subscribers, audit, emails };
}
