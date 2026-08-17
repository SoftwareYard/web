import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const expensesRouter = Router();

expensesRouter.use(requireAuth);

expensesRouter.get("/", async (req: AuthRequest, res: Response) => {
  const { from, to, storeId, expenseTypeId } = req.query;

  const where: Record<string, unknown> = {};

  if (from || to) {
    const date: { gte?: Date; lte?: Date } = {};
    if (typeof from === "string" && from) date.gte = new Date(from);
    if (typeof to === "string" && to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      date.lte = end;
    }
    where.date = date;
  }
  if (typeof storeId === "string" && storeId) where.storeId = storeId;
  if (typeof expenseTypeId === "string" && expenseTypeId) where.expenseTypeId = expenseTypeId;

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      store: { select: { id: true, title: true } },
      expenseType: { select: { id: true, type: true } },
    },
    orderBy: { date: "desc" },
  });
  res.json(expenses);
});

expensesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const { expenseTypeId, storeId, amount, date } = req.body;

  if (!expenseTypeId || !storeId || !amount || !date) {
    res.status(400).json({ error: "expenseTypeId, storeId, amount and date are required" });
    return;
  }

  const expense = await prisma.expense.create({
    data: {
      expenseTypeId,
      storeId,
      amount: parseFloat(amount),
      date: new Date(date),
    },
    include: {
      store: { select: { id: true, title: true } },
      expenseType: { select: { id: true, type: true } },
    },
  });
  res.status(201).json(expense);
});

expensesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { expenseTypeId, storeId, amount, date } = req.body;

  if (!expenseTypeId || !storeId || !amount || !date) {
    res.status(400).json({ error: "expenseTypeId, storeId, amount and date are required" });
    return;
  }

  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        expenseTypeId,
        storeId,
        amount: parseFloat(amount),
        date: new Date(date),
      },
      include: {
        store: { select: { id: true, title: true } },
        expenseType: { select: { id: true, type: true } },
      },
    });
    res.json(expense);
  } catch {
    res.status(404).json({ error: "Expense not found" });
  }
});

expensesRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  try {
    await prisma.expense.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "Expense not found" });
  }
});
