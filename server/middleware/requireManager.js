import { getManagerSession } from "../services/auth.service.js";

export async function requireManager(req, res, next) {
  try {
    const session = await getManagerSession(req);
    if (!session) return res.status(401).json({ message: "Manager login required." });
    req.manager = session;
    next();
  } catch (error) {
    console.error("Manager session check failed:", error);
    res.status(401).json({ message: "Manager login required." });
  }
}
