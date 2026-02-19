import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const applicationsRouter = Router();

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

    const where: Record<string, unknown> = {};

    if (search) {
      where.fullName = { contains: search, mode: "insensitive" };
    }

    if (roleId) {
      where.roleId = roleId;
    }

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobApplication.count({ where }),
    ]);

    res.json({
      data: applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }
);

// PROTECTED: Get single application by ID
applicationsRouter.get(
  "/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    const application = await prisma.jobApplication.findUnique({
      where: { id: req.params.id as string },
      include: { role: true },
    });

    if (!application) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    res.json(application);
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
