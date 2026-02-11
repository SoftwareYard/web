import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const teamRouter = Router();

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
teamRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  const { name, role, image, bio, linkedin, twitter, github, sortOrder } =
    req.body;
  const member = await prisma.teamMember.create({
    data: {
      name,
      role,
      image: image || "",
      bio: bio || "",
      linkedin: linkedin || null,
      twitter: twitter || null,
      github: github || null,
      sortOrder: sortOrder ?? 0,
    },
  });
  res.status(201).json(member);
});

// PROTECTED: Update team member
teamRouter.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, role, image, bio, linkedin, twitter, github, sortOrder } =
    req.body;
  const member = await prisma.teamMember.update({
    where: { id },
    data: {
      name,
      role,
      image,
      bio,
      linkedin: linkedin || null,
      twitter: twitter || null,
      github: github || null,
      sortOrder,
    },
  });
  res.json(member);
});

// PROTECTED: Delete team member
teamRouter.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.teamMember.delete({ where: { id } });
  res.json({ success: true });
});
