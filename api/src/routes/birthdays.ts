import { Router, Request, Response } from "express";
import { getUpcomingBirthdays } from "../services/birthday-notice.service";

export const birthdaysRouter = Router();

// PUBLIC: upcoming birthdays within the given window (defaults to 7 days)
birthdaysRouter.get("/upcoming", async (req: Request, res: Response) => {
  const windowDays = Number(req.query.days) || 7;
  const birthdays = await getUpcomingBirthdays(windowDays);
  res.json(birthdays);
});
