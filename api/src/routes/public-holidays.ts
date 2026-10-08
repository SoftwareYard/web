import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import {
  getNextNonWorkingDay,
  sendHolidayNotice,
} from "../services/holiday-notice.service";

export const publicHolidaysRouter = Router();

// PUBLIC: list holidays for a given year (defaults to current year)
publicHolidaysRouter.get("/", async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();

  const holidays = await prisma.publicHoliday.findMany({
    where: {
      date: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1)),
      },
    },
    orderBy: { date: "asc" },
  });

  res.json(holidays);
});

// Next upcoming non-working day (a holiday, or the day a Sunday holiday is moved to)
publicHolidaysRouter.get(
  "/next",
  requireAuth,
  async (_req: AuthRequest, res: Response) => {
    res.json(await getNextNonWorkingDay());
  }
);

// Posts the Slack notice for the next upcoming non-working day
publicHolidaysRouter.post(
  "/next/notify",
  requireAuth,
  async (_req: AuthRequest, res: Response) => {
    if (!process.env.SLACK_GENERAL_WEBHOOK_URL) {
      res.status(500).json({ error: "Slack webhook is not configured" });
      return;
    }

    const day = await getNextNonWorkingDay();
    if (!day) {
      res.status(404).json({ error: "No upcoming holiday found" });
      return;
    }

    try {
      await sendHolidayNotice(day);
      res.json(day);
    } catch (err) {
      console.error("[holiday-notice] Manual send failed:", err);
      res.status(502).json({ error: "Failed to send Slack message" });
    }
  }
);

publicHolidaysRouter.post(
  "/",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const { date, name } = req.body;

    if (!date || !name) {
      res.status(400).json({ error: "Date and name are required" });
      return;
    }

    const existing = await prisma.publicHoliday.findUnique({
      where: { date: new Date(date) },
    });
    if (existing) {
      res.status(409).json({ error: "A holiday already exists on this date" });
      return;
    }

    const holiday = await prisma.publicHoliday.create({
      data: { date: new Date(date), name },
    });
    res.status(201).json(holiday);
  }
);

publicHolidaysRouter.put(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const { date, name } = req.body;

    if (!date || !name) {
      res.status(400).json({ error: "Date and name are required" });
      return;
    }

    const existing = await prisma.publicHoliday.findUnique({
      where: { date: new Date(date) },
    });
    if (existing && existing.id !== id) {
      res.status(409).json({ error: "A holiday already exists on this date" });
      return;
    }

    try {
      const holiday = await prisma.publicHoliday.update({
        where: { id },
        data: { date: new Date(date), name },
      });
      res.json(holiday);
    } catch {
      res.status(404).json({ error: "Holiday not found" });
    }
  }
);

publicHolidaysRouter.delete(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);

    try {
      await prisma.publicHoliday.delete({ where: { id } });
      res.json({ success: true });
    } catch {
      res.status(404).json({ error: "Holiday not found" });
    }
  }
);
