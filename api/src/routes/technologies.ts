import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const technologiesRouter = Router();

technologiesRouter.use(requireAuth);

technologiesRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const technologies = await prisma.technology.findMany({ orderBy: { name: "asc" } });
  res.json(technologies);
});

technologiesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  try {
    const technology = await prisma.technology.create({ data: { name } });
    res.status(201).json(technology);
  } catch {
    res.status(409).json({ error: "Technology already exists" });
  }
});
