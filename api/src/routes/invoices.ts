import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const invoicesRouter = Router();

invoicesRouter.use(requireAuth);

invoicesRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(invoices);
});

invoicesRouter.post("/", async (req: AuthRequest, res: Response) => {
  const { issuerTitle, amount, paid, paidDate } = req.body;

  if (!issuerTitle || amount === undefined) {
    res.status(400).json({ error: "issuerTitle and amount are required" });
    return;
  }

  const createdAt = new Date();
  const dueDate = new Date(createdAt);
  dueDate.setDate(dueDate.getDate() + 7);

  const isPaid = paid ?? false;
  const resolvedPaidDate = isPaid
    ? paidDate ? new Date(paidDate) : new Date()
    : null;

  const invoice = await prisma.invoice.create({
    data: {
      issuerTitle,
      amount: Number(amount),
      paid: isPaid,
      paidDate: resolvedPaidDate,
      dueDate,
    },
  });

  res.status(201).json(invoice);
});

invoicesRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { issuerTitle, amount, paid, paidDate } = req.body;

  const data: {
    issuerTitle?: string;
    amount?: number;
    paid?: boolean;
    paidDate?: Date | null;
  } = {};
  if (issuerTitle !== undefined) data.issuerTitle = issuerTitle;
  if (amount !== undefined) data.amount = Number(amount);
  if (paid !== undefined) {
    const isPaid = Boolean(paid);
    data.paid = isPaid;
    if (isPaid) {
      data.paidDate = paidDate ? new Date(paidDate) : new Date();
    } else {
      data.paidDate = null;
    }
  }
  if (paidDate !== undefined && data.paidDate === undefined) {
    data.paidDate = paidDate ? new Date(paidDate) : null;
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  try {
    const invoice = await prisma.invoice.update({ where: { id }, data });
    res.json(invoice);
  } catch {
    res.status(404).json({ error: "Invoice not found" });
  }
});

invoicesRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  try {
    await prisma.invoice.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "Invoice not found" });
  }
});
