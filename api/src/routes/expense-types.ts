import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const expenseTypesRouter = Router();

expenseTypesRouter.use(requireAuth);

expenseTypesRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const types = await prisma.expenseType.findMany({ orderBy: { type: "asc" } });
  res.json(types);
});

expenseTypesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const { type } = req.body;

  if (!type) {
    res.status(400).json({ error: "type is required" });
    return;
  }

  try {
    const expenseType = await prisma.expenseType.create({ data: { type } });
    res.status(201).json(expenseType);
  } catch {
    res.status(409).json({ error: "Expense type already exists" });
  }
});

expenseTypesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { type } = req.body;

  if (!type) {
    res.status(400).json({ error: "type is required" });
    return;
  }

  try {
    const expenseType = await prisma.expenseType.update({ where: { id }, data: { type } });
    res.json(expenseType);
  } catch {
    res.status(404).json({ error: "Expense type not found" });
  }
});

expenseTypesRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  try {
    await prisma.expenseType.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "Expense type not found" });
  }
});
