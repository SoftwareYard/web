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

// PROTECTED: Get all candidate roles (for filter dropdown)
applicationsRouter.get(
  "/roles",
  requireAuth,
  async (_req: Request, res: Response) => {
    const roles = await prisma.candidateRole.findMany({
      orderBy: { name: "asc" },
    });
    res.json(roles);
  }
);
