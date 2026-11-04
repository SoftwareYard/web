import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { deleteFromBunny } from "../lib/bunny";
import { applicationSalaryFromNetEur } from "../services/salary.calculator.service";

export const applicationsRouter = Router();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

// PROTECTED: Get all applications with pagination, search, and role filter
applicationsRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = [10, 25, 50].includes(Number(req.query.limit))
      ? Number(req.query.limit)
      : 10;
    const search = (req.query.search as string) || "";
    const roleId = (req.query.roleId as string) || "";
    const sortDir = req.query.sortDir === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = {};

    if (search) {
      where.fullName = { contains: search, mode: "insensitive" };
    }

    if (roleId) {
      where.roleId = roleId;
    }

    // Blocked applicants only show up in the blocked list
    const blocked = await prisma.blockedApplicant.findMany({ select: { email: true } });
    if (blocked.length) {
      where.NOT = {
        OR: blocked.map(({ email }) => ({ email: { equals: email, mode: "insensitive" } })),
      };
    }

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobApplication.count({ where }),
    ]);

    // How many times each applicant on this page has applied, matched by email
    const emails = [...new Set(applications.map((a) => normalizeEmail(a.email)))];
    const counts = emails.length
      ? await prisma.$queryRaw<{ email: string; count: number }[]>`
          SELECT lower(trim(email)) AS email, count(*)::int AS count
          FROM job_applications
          WHERE lower(trim(email)) = ANY(${emails})
          GROUP BY lower(trim(email))
        `
      : [];
    const countByEmail = new Map(counts.map((c) => [c.email, c.count]));

    res.json({
      data: applications.map((a) => ({
        ...a,
        applicationCount: countByEmail.get(normalizeEmail(a.email)) ?? 1,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }
);

// PROTECTED: Get all candidate roles (for filter dropdown)
applicationsRouter.get(
  "/roles",
  requireAuth,
  async (_req: Request, res: Response) => {
    const roles = await prisma.$queryRaw<{ id: string; name: string }[]>`
      SELECT id, name FROM candidate_roles
      ORDER BY CASE WHEN name = 'OTHER' THEN 1 ELSE 0 END, name ASC
    `;
    res.json(roles);
  }
);

// PROTECTED: List blocked applicants
applicationsRouter.get(
  "/blocked",
  requireAuth,
  async (_req: Request, res: Response) => {
    const blocked = await prisma.blockedApplicant.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(blocked);
  }
);

// PROTECTED: Unblock an applicant
applicationsRouter.delete(
  "/blocked/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    await prisma.blockedApplicant.deleteMany({
      where: { id: req.params.id as string },
    });
    res.json({ success: true });
  }
);

// PROTECTED: Get single application by ID
applicationsRouter.get(
  "/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    const application = await prisma.jobApplication.findUnique({
      where: { id: req.params.id as string },
      include: { role: true, profile: { omit: { cvText: true } } },
    });

    if (!application) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const blocked = await prisma.blockedApplicant.findUnique({
      where: { email: application.email.trim().toLowerCase() },
    });

    // Other applications from the same email, newest first
    const otherApplications = await prisma.$queryRaw<
      { id: string; jobTitle: string; createdAt: Date }[]
    >`
      SELECT id, job_title AS "jobTitle", created_at AS "createdAt"
      FROM job_applications
      WHERE lower(trim(email)) = ${normalizeEmail(application.email)} AND id <> ${application.id}
      ORDER BY created_at DESC
    `;

    res.json({ ...application, blocked, otherApplications });
  }
);

// PROTECTED: Block the applicant's email so further applications are ignored
applicationsRouter.post(
  "/:id/block",
  requireAuth,
  async (req: Request, res: Response) => {
    const application = await prisma.jobApplication.findUnique({
      where: { id: req.params.id as string },
    });

    if (!application) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const email = application.email.trim().toLowerCase();
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() || null : null;

    const blocked = await prisma.blockedApplicant.upsert({
      where: { email },
      create: { email, fullName: application.fullName, reason },
      update: { reason },
    });

    res.json(blocked);
  }
);

// PROTECTED: Update notes on an application
applicationsRouter.patch(
  "/:id/notes",
  requireAuth,
  async (req: Request, res: Response) => {
    const { hrNotes, techNotes } = req.body;

    const application = await prisma.jobApplication.update({
      where: { id: req.params.id as string },
      data: { hrNotes, techNotes },
    });

    res.json(application);
  }
);

// PROTECTED: Update interview dates on an application
applicationsRouter.patch(
  "/:id/interviews",
  requireAuth,
  async (req: Request, res: Response) => {
    const { hrInterviewTime, firstInterviewTime, secondInterviewTime } = req.body;

    const application = await prisma.jobApplication.update({
      where: { id: req.params.id as string },
      data: {
        hrInterviewTime: hrInterviewTime ? new Date(hrInterviewTime) : null,
        firstInterviewTime: firstInterviewTime ? new Date(firstInterviewTime) : null,
        secondInterviewTime: secondInterviewTime ? new Date(secondInterviewTime) : null,
      },
    });

    res.json(application);
  }
);

// PROTECTED: Edit an application's details; changing the salary recalculates all four salary fields
applicationsRouter.patch(
  "/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    const { fullName, email, phone, jobTitle, roleId, salaryNetEur } = req.body ?? {};
    const data: Record<string, unknown> = {};

    for (const [key, value] of Object.entries({ fullName, email, phone, jobTitle })) {
      if (value === undefined) continue;
      const text = typeof value === "string" ? value.trim() : "";
      if (!text) {
        res.status(400).json({ error: `${key} can't be empty` });
        return;
      }
      data[key] = text;
    }

    if (roleId !== undefined) data.roleId = roleId || null;

    if (salaryNetEur !== undefined) {
      const salary = Number(salaryNetEur);
      if (!Number.isInteger(salary) || salary <= 0) {
        res.status(400).json({ error: "Expected salary must be a whole number greater than 0" });
        return;
      }
      Object.assign(data, applicationSalaryFromNetEur(salary));
    }

    const exists = await prisma.jobApplication.findUnique({ where: { id: req.params.id as string } });
    if (!exists) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const application = await prisma.jobApplication.update({
      where: { id: req.params.id as string },
      data,
      include: { role: true },
    });
    res.json(application);
  }
);

// PROTECTED: Put an application on hold (skipped by AI scans and screenings) or release it
applicationsRouter.patch(
  "/:id/hold",
  requireAuth,
  async (req: Request, res: Response) => {
    const onHold = req.body?.onHold === true;
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() || null : null;

    const exists = await prisma.jobApplication.findUnique({ where: { id: req.params.id as string } });
    if (!exists) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const application = await prisma.jobApplication.update({
      where: { id: req.params.id as string },
      data: onHold
        ? { onHold: true, holdReason: reason, heldAt: new Date() }
        : { onHold: false, holdReason: null, heldAt: null },
      select: { onHold: true, holdReason: true, heldAt: true },
    });
    res.json(application);
  }
);

// PROTECTED: Permanently delete an application, its AI results and its CV file
applicationsRouter.delete(
  "/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    const application = await prisma.jobApplication.findUnique({
      where: { id: req.params.id as string },
    });
    if (!application) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    // Profile and screening results go with it (ON DELETE CASCADE)
    await prisma.jobApplication.delete({ where: { id: application.id } });

    // Only remove files we stored, and never fail the delete over the CDN
    if (application.cvLink && process.env.BUNNY_CDN_URL && application.cvLink.startsWith(process.env.BUNNY_CDN_URL)) {
      await deleteFromBunny(application.cvLink).catch((err) =>
        console.error(`Failed to delete CV file for application ${application.id}:`, err)
      );
    }

    res.json({ success: true });
  }
);
