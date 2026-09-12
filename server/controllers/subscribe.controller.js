import { subscribeEmail } from "../services/subscribe.service.js";

export async function postSubscribe(req, res) {
  try {
    const result = await subscribeEmail(req.body?.email);
    res.json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Subscription error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Subscription failed.",
    });
  }
}
