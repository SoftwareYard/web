import { Router, Request, Response } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
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

// PUBLIC: Get all team members
teamRouter.get("/", async (_req: Request, res: Response) => {
  const members = await prisma.teamMember.findMany({
    orderBy: { sortOrder: "asc" },
  });
  res.json(members);
});

// PROTECTED: Get single team member
teamRouter.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const member = await prisma.teamMember.findUnique({ where: { id } });
  if (!member) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(member);
});

// PROTECTED: Create team member
teamRouter.post(
  "/",
  requireAuth,
  upload.single("image"),
  async (req: Request, res: Response) => {
    const { name, role, bio, email, phone, hireDate, currentSalaryEur, nextContractDate, sortOrder } =
      req.body;

    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadToBunny(req.file.buffer, req.file.originalname, "Team");
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
        nextContractDate: nextContractDate ? new Date(nextContractDate) : null,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      },
    });
    res.status(201).json(member);
  }
);

// PROTECTED: Update team member
teamRouter.put(
  "/:id",
  requireAuth,
  upload.single("image"),
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { name, role, bio, email, phone, hireDate, currentSalaryEur, nextContractDate, sortOrder } =
      req.body;

    const data: Record<string, unknown> = {
      name,
      role,
      bio,
      email: email || null,
      phone: phone || null,
      hireDate: hireDate ? new Date(hireDate) : null,
      currentSalaryEur: currentSalaryEur ? parseFloat(currentSalaryEur) : null,
      nextContractDate: nextContractDate ? new Date(nextContractDate) : null,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
    };

    if (req.file) {
      data.image = await uploadToBunny(req.file.buffer, req.file.originalname, "Team");
    }

    const member = await prisma.teamMember.update({
      where: { id },
      data,
    });
    res.json(member);
  }
);

// PROTECTED: Delete team member
teamRouter.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.teamMember.delete({ where: { id } });
  res.json({ success: true });
});
