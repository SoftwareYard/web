import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireSuperAdmin, AuthRequest } from "../middleware/auth";

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

publicHolidaysRouter.post(
  "/",
  requireAuth,
  requireSuperAdmin,
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
  requireSuperAdmin,
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
  requireSuperAdmin,
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
