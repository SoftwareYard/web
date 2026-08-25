import { Router, Request, Response } from "express";

export const chatBotRouter = Router();

// PUBLIC: log a visitor question the FAQ bot couldn't answer, for review
// Slack notification disabled for now — logging to console only.
chatBotRouter.post("/unmatched", (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const text = message.trim().slice(0, 500);
  console.log(`[chat-bot] Unmatched question: "${text}"`);

  res.json({ success: true });
});
