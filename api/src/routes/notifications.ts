import { Router, Request, Response } from "express";
import { requireAuth, requireSuperAdmin } from "../middleware/auth";
import { checkOverdueInvoices } from "../services/overdue-invoices.service";
import { checkOverdueContracts } from "../services/overdue-contracts.service";
import { checkTodaysBirthdays } from "../services/birthday-notice.service";
import { runDatabaseBackup, getLatestBackup } from "../services/db-backup.service";

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

// PROTECTED: Manually trigger today's birthday Slack check (general channel)
notificationsRouter.post(
  "/birthdays",
  requireAuth,
  async (_req: Request, res: Response) => {
    try {
      const sentCount = await checkTodaysBirthdays();
      res.json({ sentCount });
    } catch (err) {
      console.error("[notifications] Manual birthdays trigger failed:", err);
      res.status(500).json({ error: "Failed to send Slack notification" });
    }
  }
);

// PROTECTED (SuperAdmin): Latest backup stored on Bunny (null if none yet)
notificationsRouter.get(
  "/db-backup",
  requireAuth,
  requireSuperAdmin,
  async (_req: Request, res: Response) => {
    try {
      res.json(await getLatestBackup());
    } catch (err) {
      console.error("[notifications] Fetching latest db-backup failed:", err);
      res.status(500).json({ error: "Failed to fetch latest backup" });
    }
  }
);

// PROTECTED (SuperAdmin): Run the database backup to Bunny now, outside the Friday schedule
notificationsRouter.post(
  "/db-backup",
  requireAuth,
  requireSuperAdmin,
  async (_req: Request, res: Response) => {
    try {
      const { fileName, sizeBytes } = await runDatabaseBackup();
      res.json({ fileName, sizeBytes });
    } catch (err) {
      console.error("[notifications] Manual db-backup trigger failed:", err);
      res.status(500).json({ error: "Database backup failed" });
    }
  }
);
