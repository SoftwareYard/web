import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const assetTypesRouter = Router();

assetTypesRouter.use(requireAuth);

assetTypesRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const types = await prisma.assetType.findMany({ orderBy: { type: "asc" } });
  res.json(types);
});

assetTypesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const { type } = req.body;

  if (!type) {
    res.status(400).json({ error: "type is required" });
    return;
  }

  try {
    const assetType = await prisma.assetType.create({ data: { type } });
    res.status(201).json(assetType);
  } catch {
    res.status(409).json({ error: "Asset type already exists" });
  }
});

assetTypesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { type } = req.body;

  if (!type) {
    res.status(400).json({ error: "type is required" });
    return;
  }

  try {
    const assetType = await prisma.assetType.update({ where: { id }, data: { type } });
    res.json(assetType);
  } catch {
    res.status(404).json({ error: "Asset type not found" });
  }
});

assetTypesRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  try {
    await prisma.assetType.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "Asset type not found" });
  }
});
