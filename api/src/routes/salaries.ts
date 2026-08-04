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
