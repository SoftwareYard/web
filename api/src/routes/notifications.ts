import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { checkOverdueInvoices } from "../services/overdue-invoices.service";
import { checkOverdueContracts } from "../services/overdue-contracts.service";

export const notificationsRouter = Router();

// PROTECTED: Manually trigger the overdue invoices Slack check (sy_info channel)
notificationsRouter.post(
  "/overdue-invoices",
  requireAuth,
  async (_req: Request, res: Response) => {
    try {
      const overdueCount = await checkOverdueInvoices();
      res.json({ overdueCount });
    } catch (err) {
      console.error("[notifications] Manual overdue-invoices trigger failed:", err);
      res.status(500).json({ error: "Failed to send Slack notification" });
    }
  }
);

// PROTECTED: Manually trigger the overdue contracts Slack check (sy_info channel)
notificationsRouter.post(
  "/overdue-contracts",
  requireAuth,
  async (_req: Request, res: Response) => {
    try {
      const overdueCount = await checkOverdueContracts();
      res.json({ overdueCount });
    } catch (err) {
      console.error("[notifications] Manual overdue-contracts trigger failed:", err);
      res.status(500).json({ error: "Failed to send Slack notification" });
    }
  }
);
