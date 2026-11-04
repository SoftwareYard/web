import { Router, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { findUnscannedApplications, runScan, scanState } from "../services/cv-scan.service";
import { aiStatus } from "../lib/anthropic";

export const candidatesRouter = Router();

interface CandidateRow {
  applicationId: string;
  fullName: string;
  email: string;
  jobTitle: string;
  roleName: string | null;
  salaryNetEur: number;
  appliedAt: Date;
  onHold: boolean;
  holdReason: string | null;
  applicationCount: number;
  primarySkills: string[];
  allSkills: string[];
  yearsExperience: number | null;
  about: string | null;
  summary: string | null;
  scannedAt: Date;
}

// Escape LIKE wildcards so a search for "c_" or "50%" is taken literally
const likePattern = (s: string) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const SORTS: Record<string, Prisma.Sql> = {
  scanned: Prisma.sql`"scannedAt" DESC`,
  experience: Prisma.sql`"yearsExperience" DESC NULLS LAST`,
  salary: Prisma.sql`"salaryNetEur" ASC`,
  applied: Prisma.sql`"appliedAt" DESC`,
};

// PROTECTED: Scanned candidates — one row per person (their latest scanned application)
candidatesRouter.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const q = req.query as Record<string, string | undefined>;
  const page = Math.max(1, parseInt(q.page ?? "") || 1);
  const limit = [10, 25, 50].includes(Number(q.limit)) ? Number(q.limit) : 25;
  const sort = SORTS[q.sort ?? ""] ?? SORTS.scanned;

  const filters: Prisma.Sql[] = [];

  const search = q.search?.trim();
  if (search) {
    const p = likePattern(search);
    filters.push(Prisma.sql`(
      "fullName" ILIKE ${p} OR email ILIKE ${p} OR about ILIKE ${p} OR summary ILIKE ${p}
      OR array_to_string("allSkills", ' ') ILIKE ${p}
    )`);
  }

  // Every listed skill must appear; ".net" also matches "ASP.NET Core"
  const skills = (q.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  for (const skill of skills) {
    filters.push(
      Prisma.sql`EXISTS (SELECT 1 FROM unnest("allSkills") s WHERE s ILIKE ${likePattern(skill)})`
    );
  }

  const minYears = parseFloat(q.minYears ?? "");
  if (!isNaN(minYears)) filters.push(Prisma.sql`"yearsExperience" >= ${minYears}`);

  const maxSalary = parseInt(q.maxSalary ?? "");
  if (!isNaN(maxSalary)) filters.push(Prisma.sql`"salaryNetEur" <= ${maxSalary}`);

  if (q.roleId) filters.push(Prisma.sql`"roleId" = ${q.roleId}`);

  if (q.includeOnHold !== "1") filters.push(Prisma.sql`NOT "onHold"`);

  const where = filters.length ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}` : Prisma.empty;

  const latest = Prisma.sql`
    SELECT DISTINCT ON (lower(trim(a.email)))
      a.id AS "applicationId", a.full_name AS "fullName", a.email, a.job_title AS "jobTitle",
      a.role_id AS "roleId", r.name AS "roleName", a.salary_net_eur AS "salaryNetEur",
      a.created_at AS "appliedAt", a.on_hold AS "onHold", a.hold_reason AS "holdReason",
      (SELECT count(*)::int FROM job_applications o
        WHERE lower(trim(o.email)) = lower(trim(a.email))) AS "applicationCount",
      p.primary_skills AS "primarySkills", p.all_skills AS "allSkills",
      p.years_experience AS "yearsExperience", p.about, p.summary, p.scanned_at AS "scannedAt"
    FROM job_applications a
    JOIN candidate_profiles p ON p.application_id = a.id AND p.status = 'done'
    LEFT JOIN candidate_roles r ON r.id = a.role_id
    WHERE lower(trim(a.email)) NOT IN (SELECT email FROM blocked_applicants)
    ORDER BY lower(trim(a.email)), a.created_at DESC
  `;

  const [rows, [{ total }]] = await Promise.all([
    prisma.$queryRaw<CandidateRow[]>`
      SELECT * FROM (${latest}) c ${where}
      ORDER BY ${sort}
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `,
    prisma.$queryRaw<{ total: number }[]>`
      SELECT count(*)::int AS total FROM (${latest}) c ${where}
    `,
  ]);

  res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// PROTECTED: Scan progress and how many CVs are waiting
candidatesRouter.get("/scan", requireAuth, async (_req: AuthRequest, res: Response) => {
  const pending = scanState.running ? null : (await findUnscannedApplications()).length;
  const failed = await prisma.candidateProfile.count({ where: { status: "error" } });
  const onHold = await prisma.jobApplication.count({ where: { onHold: true } });
  res.json({ ...scanState, pending, failedTotal: failed, onHold, aiProblem: aiStatus.problem });
});

// PROTECTED: Scan every CV that hasn't been scanned yet (runs in the background)
candidatesRouter.post("/scan", requireAuth, async (_req: AuthRequest, res: Response) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
    return;
  }
  if (scanState.running) {
    res.status(409).json({ error: "A scan is already running" });
    return;
  }
  runScan().catch((err) => console.error("[cv-scan] run failed:", err));
  res.json({ started: true });
});
