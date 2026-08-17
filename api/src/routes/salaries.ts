import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireSuperAdmin, AuthRequest } from "../middleware/auth";

export const salariesRouter = Router();

salariesRouter.use(requireAuth, requireSuperAdmin);

const salaryRowSelect = {
  id: true,
  name: true,
  role: true,
  currentSalaryEur: true,
  currentSalaryGross: true,
  invoiceValue: true,
  managementFee: true,
} as const;

salariesRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const members = await prisma.teamMember.findMany({
    orderBy: { sortOrder: "asc" },
    select: salaryRowSelect,
  });
  res.json(members);
});

salariesRouter.put("/:id/invoice-value", async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { invoiceValue } = req.body;

  try {
    const member = await prisma.teamMember.update({
      where: { id },
      data: {
        invoiceValue: invoiceValue !== null && invoiceValue !== undefined && invoiceValue !== "" ? parseFloat(invoiceValue) : null,
      },
      select: salaryRowSelect,
    });
    res.json(member);
  } catch {
    res.status(404).json({ error: "Team member not found" });
  }
});

salariesRouter.put("/:id/management-fee", async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { managementFee } = req.body;

  try {
    const member = await prisma.teamMember.update({
      where: { id },
      data: {
        managementFee: managementFee !== null && managementFee !== undefined && managementFee !== "" ? parseFloat(managementFee) : null,
      },
      select: salaryRowSelect,
    });
    res.json(member);
  } catch {
    res.status(404).json({ error: "Team member not found" });
  }
});

// Get payrise history for a team member
salariesRouter.get("/:id/payrises", async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const payrises = await prisma.payrise.findMany({
    where: { userId: id },
    orderBy: { date: "desc" },
  });
  res.json(payrises);
});

// Add a payrise entry for a team member
salariesRouter.post("/:id/payrises", async (req: AuthRequest, res: Response) => {
  const userId = req.params.id as string;
  const { netSalary, grossSalary, date } = req.body;

  if (!netSalary || !grossSalary || !date) {
    res.status(400).json({ error: "netSalary, grossSalary and date are required" });
    return;
  }

  const payrise = await prisma.payrise.create({
    data: {
      userId,
      netSalary: parseFloat(netSalary),
      grossSalary: parseFloat(grossSalary),
      date: new Date(date),
    },
  });
  res.status(201).json(payrise);
});

// Update a payrise entry
salariesRouter.put("/payrises/:payriseId", async (req: AuthRequest, res: Response) => {
  const payriseId = req.params.payriseId as string;
  const { netSalary, grossSalary, date } = req.body;

  try {
    const payrise = await prisma.payrise.update({
      where: { id: payriseId },
      data: {
        netSalary: parseFloat(netSalary),
        grossSalary: parseFloat(grossSalary),
        date: new Date(date),
      },
    });
    res.json(payrise);
  } catch {
    res.status(404).json({ error: "Payrise not found" });
  }
});

// Delete a payrise entry
salariesRouter.delete("/payrises/:payriseId", async (req: AuthRequest, res: Response) => {
  const payriseId = req.params.payriseId as string;
  try {
    await prisma.payrise.delete({ where: { id: payriseId } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "Payrise not found" });
  }
});
