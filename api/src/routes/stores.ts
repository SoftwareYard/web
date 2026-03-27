import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const storesRouter = Router();

storesRouter.use(requireAuth);

storesRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const stores = await prisma.store.findMany({ orderBy: { title: "asc" } });
  res.json(stores);
});

storesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const { title } = req.body;

  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const store = await prisma.store.create({ data: { title } });
  res.status(201).json(store);
});

storesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { title } = req.body;

  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  try {
    const store = await prisma.store.update({ where: { id }, data: { title } });
    res.json(store);
  } catch {
    res.status(404).json({ error: "Store not found" });
  }
});

storesRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  try {
    await prisma.store.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "Store not found" });
  }
});
