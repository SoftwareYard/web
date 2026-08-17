import { Router, Request, Response } from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { requireAuth, requireSuperAdmin, AuthRequest } from "../middleware/auth";
import { uploadToBunny } from "../lib/bunny";

export const teamRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// PROTECTED: Get all candidate roles for dropdown
teamRouter.get("/roles", requireAuth, async (_req: Request, res: Response) => {
  const roles = await prisma.$queryRaw<{ id: string; name: string }[]>`
    SELECT id, name FROM candidate_roles
    ORDER BY CASE WHEN name = 'OTHER' THEN 1 ELSE 0 END, name ASC
  `;
  res.json(roles);
});

function sanitizeMember<
  T extends {
    invoiceValue?: number | null;
    managementFee?: number | null;
    password?: string | null;
    dateOfBirth?: Date | null;
    secondContactName?: string | null;
    secondContactPhone?: string | null;
  }
>(member: T) {
  const {
    invoiceValue,
    managementFee,
    password,
    dateOfBirth,
    secondContactName,
    secondContactPhone,
    ...rest
  } = member;
  return rest;
}

// Additional stripping for the public, unauthenticated endpoint — archive
// number, address, city and EMBG are only ever shown inside the CMS.
function sanitizePublicMember<
  T extends {
    invoiceValue?: number | null;
    managementFee?: number | null;
    password?: string | null;
    dateOfBirth?: Date | null;
    secondContactName?: string | null;
    secondContactPhone?: string | null;
    archiveNo?: string | null;
    address?: string | null;
    city?: string | null;
    embg?: string | null;
  }
>(member: T) {
  const {
    invoiceValue,
    managementFee,
    password,
    dateOfBirth,
    secondContactName,
    secondContactPhone,
    archiveNo,
    address,
    city,
    embg,
    ...rest
  } = member;
  return rest;
}

// PUBLIC: Get all team members
teamRouter.get("/", async (_req: Request, res: Response) => {
  const members = await prisma.teamMember.findMany({
    orderBy: { sortOrder: "asc" },
  });
  res.json(members.map(sanitizePublicMember));
});

// PROTECTED: Get single team member
teamRouter.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...sanitizeMember(member), hasPortalAccess: member.password !== null });
});

// PROTECTED: Create team member
teamRouter.post(
  "/",
  requireAuth,
  upload.single("image"),
  async (req: Request, res: Response) => {
    const { name, role, bio, email, phone, hireDate, currentSalaryEur, currentSalaryGross, contractInMonths, lastContractDate, sortOrder, archiveNo, address, city, embg } =
      req.body;

    if (email) {
      const existing = await prisma.teamMember.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ error: "Email already in use" });
        return;
      }
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadToBunny(req.file.buffer, req.file.originalname, "Team");
    }

    const parsedContractInMonths = contractInMonths ? parseInt(contractInMonths) : null;
    const parsedLastContractDate = lastContractDate ? new Date(lastContractDate) : null;
    let computedNextContractDate: Date | null = null;
    if (parsedLastContractDate && parsedContractInMonths) {
      computedNextContractDate = new Date(parsedLastContractDate);
      computedNextContractDate.setMonth(computedNextContractDate.getMonth() + parsedContractInMonths);
    }

    const member = await prisma.teamMember.create({
      data: {
        name,
        role,
        image: imageUrl,
        bio: bio || "",
        email: email || null,
        phone: phone || null,
        hireDate: hireDate ? new Date(hireDate) : null,
        currentSalaryEur: currentSalaryEur ? parseFloat(currentSalaryEur) : null,
        currentSalaryGross: currentSalaryGross ? parseFloat(currentSalaryGross) : null,
        contractInMonths: parsedContractInMonths,
        lastContractDate: parsedLastContractDate,
        nextContractDate: computedNextContractDate,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        archiveNo: archiveNo || null,
        address: address || null,
        city: city || null,
        embg: embg || null,
      },
    });
    res.status(201).json(sanitizeMember(member));
  }
);

// PROTECTED: Update team member
teamRouter.put(
  "/:id",
  requireAuth,
  upload.single("image"),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { name, role, bio, email, phone, hireDate, currentSalaryEur, currentSalaryGross, contractInMonths, lastContractDate, sortOrder, archiveNo, address, city, embg } =
      req.body;

    if (email) {
      const existing = await prisma.teamMember.findUnique({ where: { email } });
      if (existing && existing.id !== id) {
        res.status(409).json({ error: "Email already in use" });
        return;
      }
    }

    const parsedContractInMonths = contractInMonths ? parseInt(contractInMonths) : null;
    const parsedLastContractDate = lastContractDate ? new Date(lastContractDate) : null;
    let computedNextContractDate: Date | null = null;
    if (parsedLastContractDate && parsedContractInMonths) {
      computedNextContractDate = new Date(parsedLastContractDate);
      computedNextContractDate.setMonth(computedNextContractDate.getMonth() + parsedContractInMonths);
    }

    const data: Record<string, unknown> = {
      name,
      role,
      bio,
      email: email || null,
      phone: phone || null,
      hireDate: hireDate ? new Date(hireDate) : null,
      currentSalaryEur: currentSalaryEur ? parseFloat(currentSalaryEur) : null,
      currentSalaryGross: currentSalaryGross ? parseFloat(currentSalaryGross) : null,
      contractInMonths: parsedContractInMonths,
      lastContractDate: parsedLastContractDate,
      nextContractDate: computedNextContractDate,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      archiveNo: archiveNo || null,
      address: address || null,
      city: city || null,
      embg: embg || null,
    };

    if (req.file) {
      data.image = await uploadToBunny(req.file.buffer, req.file.originalname, "Team");
    }

    const member = await prisma.teamMember.update({
      where: { id },
      data,
    });
    res.json(sanitizeMember(member));
  }
);

// PROTECTED (SuperAdmin): Enable or reset time off portal access for a team member
teamRouter.put(
  "/:id/portal-access",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const { password } = req.body;

    if (!password || password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const member = await prisma.teamMember.findUnique({ where: { id } });
    if (!member) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!member.email) {
      res.status(400).json({
        error: "Team member must have an email set before enabling portal access",
      });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.teamMember.update({ where: { id }, data: { password: hashed } });

    res.json({ hasPortalAccess: true });
  }
);

// PROTECTED (SuperAdmin): Revoke time off portal access for a team member
teamRouter.delete(
  "/:id/portal-access",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;

    try {
      await prisma.teamMember.update({ where: { id }, data: { password: null } });
      res.json({ success: true });
    } catch {
      res.status(404).json({ error: "Not found" });
    }
  }
);

// PROTECTED: Get OneOnOne meetings for all team members within a date range (for Excel export)
teamRouter.get("/meetings/export", requireAuth, async (req: Request, res: Response) => {
  const { from, to } = req.query;

  const date: { gte?: Date; lte?: Date } = {};
  if (typeof from === "string" && from) date.gte = new Date(from);
  if (typeof to === "string" && to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    date.lte = end;
  }

  const meetings = await prisma.oneOnOneMeeting.findMany({
    where: Object.keys(date).length ? { date } : undefined,
    include: { user: { select: { id: true, name: true } } },
    orderBy: [{ user: { name: "asc" } }, { date: "asc" }],
  });
  res.json(meetings);
});

// PROTECTED: Get OneOnOne meetings for a team member
teamRouter.get("/:id/meetings", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const meetings = await prisma.oneOnOneMeeting.findMany({
    where: { userId: id },
    orderBy: { date: "desc" },
  });
  res.json(meetings);
});

// PROTECTED: Create OneOnOne meeting for a team member
teamRouter.post("/:id/meetings", requireAuth, async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  const {
    date,
    feelingAtWork,
    currentWorkload,
    thingsOutsideWork,
    problemsWithClient,
    problemsWithTeam,
    skillsToDevelop,
    growingInRole,
    trainingOpportunities,
    anythingElse,
    improvementSuggestions,
  } = req.body;

  const meeting = await prisma.oneOnOneMeeting.create({
    data: {
      userId,
      date: new Date(date),
      feelingAtWork: feelingAtWork || null,
      currentWorkload: currentWorkload || null,
      thingsOutsideWork: thingsOutsideWork || null,
      problemsWithClient: problemsWithClient || null,
      problemsWithTeam: problemsWithTeam || null,
      skillsToDevelop: skillsToDevelop || null,
      growingInRole: growingInRole || null,
      trainingOpportunities: trainingOpportunities || null,
      anythingElse: anythingElse || null,
      improvementSuggestions: improvementSuggestions || null,
    },
  });
  res.status(201).json(meeting);
});

// PROTECTED: Update OneOnOne meeting for a team member
teamRouter.put("/:id/meetings/:meetingId", requireAuth, async (req: Request, res: Response) => {
  const meetingId = req.params.meetingId as string;
  const {
    date,
    feelingAtWork,
    currentWorkload,
    thingsOutsideWork,
    problemsWithClient,
    problemsWithTeam,
    skillsToDevelop,
    growingInRole,
    trainingOpportunities,
    anythingElse,
    improvementSuggestions,
  } = req.body;

  try {
    const meeting = await prisma.oneOnOneMeeting.update({
      where: { id: meetingId },
      data: {
        date: new Date(date),
        feelingAtWork: feelingAtWork || null,
        currentWorkload: currentWorkload || null,
        thingsOutsideWork: thingsOutsideWork || null,
        problemsWithClient: problemsWithClient || null,
        problemsWithTeam: problemsWithTeam || null,
        skillsToDevelop: skillsToDevelop || null,
        growingInRole: growingInRole || null,
        trainingOpportunities: trainingOpportunities || null,
        anythingElse: anythingElse || null,
        improvementSuggestions: improvementSuggestions || null,
      },
    });
    res.json(meeting);
  } catch {
    res.status(404).json({ error: "Meeting not found" });
  }
});

// PROTECTED: Delete team member
teamRouter.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.teamMember.delete({ where: { id } });
  res.json({ success: true });
});
