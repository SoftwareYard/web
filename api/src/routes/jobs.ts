import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const jobsRouter = Router();

// PUBLIC: Get all jobs (active only by default, all if ?all=true)
jobsRouter.get("/", async (req: Request, res: Response) => {
  const showAll = req.query.all === "true";
  const jobs = await prisma.job.findMany({
    where: showAll ? {} : { isActive: true },
    include: { technology: true },
    orderBy: { postedDate: "desc" },
  });
  res.json(jobs);
});

// PUBLIC: Get single job by slug
jobsRouter.get("/by-slug/:slug", async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const job = await prisma.job.findUnique({
    where: { slug },
    include: { technology: true },
  });
  if (!job) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(job);
});

// PROTECTED: Get single job by id (for editing)
jobsRouter.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const job = await prisma.job.findUnique({
    where: { id },
    include: { technology: true },
  });
  if (!job) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(job);
});

// PROTECTED: Create job
jobsRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  const {
    slug,
    title,
    department,
    location,
    type,
    description,
    requirements,
    responsibilities,
    benefits,
    goodToHave,
    technologyId,
    postedDate,
    isActive,
  } = req.body;
  if (!technologyId) {
    res.status(400).json({ error: "technologyId is required" });
    return;
  }
  const job = await prisma.job.create({
    data: {
      slug,
      title,
      department,
      location,
      type,
      description,
      requirements: requirements || [],
      responsibilities: responsibilities || [],
      benefits: benefits || [],
      goodToHave: goodToHave || [],
      technologyId,
      postedDate: new Date(postedDate),
      isActive: isActive ?? true,
    },
  });
  res.status(201).json(job);
});

// PROTECTED: Update job
jobsRouter.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const {
    slug,
    title,
    department,
    location,
    type,
    description,
    requirements,
    responsibilities,
    benefits,
    goodToHave,
    technologyId,
    postedDate,
    isActive,
  } = req.body;
  if (!technologyId) {
    res.status(400).json({ error: "technologyId is required" });
    return;
  }
  const job = await prisma.job.update({
    where: { id },
    data: {
      slug,
      title,
      department,
      location,
      type,
      description,
      requirements,
      responsibilities,
      benefits,
      goodToHave,
      technologyId,
      postedDate: postedDate ? new Date(postedDate) : undefined,
      isActive,
    },
  });
  res.json(job);
});

// PROTECTED: Delete job
jobsRouter.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.job.delete({ where: { id } });
  res.json({ success: true });
});
