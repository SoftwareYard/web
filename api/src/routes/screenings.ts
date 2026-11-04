import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { runScreening } from "../services/cv-screening.service";
import { aiStatus } from "../lib/anthropic";

export const screeningsRouter = Router();

// Guard against an accidental run over the whole history
const MAX_APPLICATIONS_PER_RUN = 500;

async function findApplicationIds(roleId: string | null, appliedFrom: Date | null) {
  const blocked = await prisma.blockedApplicant.findMany({ select: { email: true } });
  const apps = await prisma.jobApplication.findMany({
    where: {
      onHold: false,
      ...(roleId ? { roleId } : {}),
      ...(appliedFrom ? { createdAt: { gte: appliedFrom } } : {}),
      ...(blocked.length
        ? {
            NOT: {
              OR: blocked.map(({ email }) => ({
                email: { equals: email, mode: "insensitive" as const },
              })),
            },
          }
        : {}),
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  return apps.map((a) => a.id);
}

function parseFilters(source: Record<string, unknown>) {
  const roleId = typeof source.roleId === "string" && source.roleId ? source.roleId : null;
  const from = typeof source.appliedFrom === "string" && source.appliedFrom ? new Date(source.appliedFrom) : null;
  const appliedFrom = from && !isNaN(from.getTime()) ? from : null;
  return { roleId, appliedFrom };
}

// PROTECTED: How many applications a run with these filters would screen
screeningsRouter.get("/preview", requireAuth, async (req: AuthRequest, res: Response) => {
  const { roleId, appliedFrom } = parseFilters(req.query);
  const ids = await findApplicationIds(roleId, appliedFrom);
  res.json({ count: ids.length, max: MAX_APPLICATIONS_PER_RUN, aiProblem: aiStatus.problem });
});

// PROTECTED: Start a screening run; it continues in the background
screeningsRouter.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const criteria = typeof req.body?.criteria === "string" ? req.body.criteria.trim() : "";
  if (!criteria) {
    res.status(400).json({ error: "Screening criteria are required" });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
    return;
  }

  const { roleId, appliedFrom } = parseFilters(req.body);
  const ids = await findApplicationIds(roleId, appliedFrom);
  if (ids.length === 0) {
    res.status(400).json({ error: "No applications match these filters" });
    return;
  }
  if (ids.length > MAX_APPLICATIONS_PER_RUN) {
    res.status(400).json({
      error: `${ids.length} applications match; narrow the filters to ${MAX_APPLICATIONS_PER_RUN} or fewer`,
    });
    return;
  }

  const screening = await prisma.cvScreening.create({
    data: {
      criteria,
      roleId,
      appliedFrom,
      total: ids.length,
      createdById: req.adminId ?? null,
    },
  });

  runScreening(screening.id, criteria, ids).catch(async (err) => {
    console.error(`[cv-screening] run ${screening.id} failed:`, err);
    await prisma.cvScreening
      .update({ where: { id: screening.id }, data: { status: "interrupted", finishedAt: new Date() } })
      .catch(() => {});
  });

  res.json(screening);
});

// PROTECTED: List past runs, newest first
screeningsRouter.get("/", requireAuth, async (_req: AuthRequest, res: Response) => {
  const screenings = await prisma.cvScreening.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      role: true,
      _count: { select: { results: { where: { verdict: "match" } } } },
    },
  });
  res.json(
    screenings.map(({ _count, ...s }) => ({ ...s, matches: _count.results }))
  );
});

// PROTECTED: One run with its results
screeningsRouter.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const screening = await prisma.cvScreening.findUnique({
    where: { id: req.params.id as string },
    include: {
      role: true,
      results: {
        include: {
          application: {
            select: {
              id: true,
              fullName: true,
              email: true,
              jobTitle: true,
              cvLink: true,
              salaryNetEur: true,
              createdAt: true,
            },
          },
        },
        orderBy: [{ yearsExperience: { sort: "desc", nulls: "last" } }],
      },
    },
  });

  if (!screening) {
    res.status(404).json({ error: "Screening not found" });
    return;
  }
  res.json(screening);
});

// PROTECTED: Delete a run and its results
screeningsRouter.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await prisma.cvScreening.deleteMany({ where: { id: req.params.id as string } });
  res.json({ success: true });
});
