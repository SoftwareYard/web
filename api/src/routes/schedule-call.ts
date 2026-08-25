import { Router, Request, Response } from "express";
import { sendSlackMessage } from "../lib/slack";

export const scheduleCallRouter = Router();

const MAX_DAYS_AHEAD = 7;

scheduleCallRouter.post("/", async (req: Request, res: Response) => {
  const { name, email, desiredTime } = req.body;

  if (!name || !email || !desiredTime) {
    res.status(400).json({ error: "Name, email and desired time are required" });
    return;
  }

  const parsedTime = new Date(desiredTime);
  if (isNaN(parsedTime.getTime())) {
    res.status(400).json({ error: "Invalid desired time" });
    return;
  }

  const now = new Date();
  const maxDate = new Date(now.getTime() + MAX_DAYS_AHEAD * 86_400_000);
  if (parsedTime < now || parsedTime > maxDate) {
    res.status(400).json({ error: "Desired time must be within the next 7 days" });
    return;
  }

  const formattedTime = parsedTime.toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const text = [
    ":telephone_receiver: *New call request*",
    `• *Name:* ${name}`,
    `• *Email:* ${email}`,
    `• *Requested time:* ${formattedTime}`,
  ].join("\n");

  try {
    await sendSlackMessage(text);
    res.json({ success: true });
  } catch (err) {
    console.error("[schedule-call] Failed to send Slack notification:", err);
    res.status(500).json({ error: "Failed to submit request" });
  }
});
