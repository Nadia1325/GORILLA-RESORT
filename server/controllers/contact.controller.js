import { submitContactMessage } from "../services/contact.service.js";

export async function postContact(req, res) {
  try {
    const result = await submitContactMessage(req.body);
    res.json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Contact error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Message could not be sent.",
    });
  }
}
