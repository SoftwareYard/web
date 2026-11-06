import { Router, Request, Response } from "express";
import { getUpcomingBirthdays } from "../services/birthday-notice.service";
import { getAdminId, getTeamMemberId } from "../middleware/auth";

export const birthdaysRouter = Router();

// Upcoming birthdays within the given window (defaults to 7 days), for the CMS
// dashboard and the employee portal — not public, it reveals birth dates
birthdaysRouter.get("/upcoming", async (req: Request, res: Response) => {
  if (!getAdminId(req) && !getTeamMemberId(req)) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const windowDays = Number(req.query.days) || 7;
  const birthdays = await getUpcomingBirthdays(windowDays);
  res.json(birthdays);
});
