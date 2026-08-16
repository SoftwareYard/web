import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendSlackMessage } from "../lib/slack";

export async function checkOverdueInvoices() {
  const now = new Date();

  const overdueInvoices = await prisma.invoice.findMany({
    where: { paid: false, dueDate: { lt: now } },
    orderBy: { dueDate: "asc" },
  });

  if (overdueInvoices.length === 0) {
    console.log("[overdue-invoices] No overdue invoices.");
    return;
  }

  const totalAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const lines = overdueInvoices.map((inv) => {
    const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / 86_400_000);
    return `• *${inv.issuerTitle}* — €${inv.amount.toFixed(2)}, due ${inv.dueDate.toLocaleDateString("en-GB")} (${daysOverdue}d overdue)`;
  });

  const link = process.env.CORS_ORIGIN ? `${process.env.CORS_ORIGIN}/ctrl/invoices?overdue=true` : null;

  const text = [
    `:rotating_light: *${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? "s" : ""}* — total €${totalAmount.toFixed(2)}`,
    ...lines,
    ...(link ? [`<${link}|View in CMS>`] : []),
  ].join("\n");

  await sendSlackMessage(text);
  console.log(`[overdue-invoices] Sent Slack alert for ${overdueInvoices.length} overdue invoice(s).`);
}

// Runs at 08:00, Monday through Friday
export function startOverdueInvoicesCron() {
  cron.schedule("0 8 * * 1-5", () => {
    console.log("[overdue-invoices] Running overdue invoices check...");
    checkOverdueInvoices().catch((err) =>
      console.error("[overdue-invoices] Error:", err)
    );
  });

  console.log("[overdue-invoices] Cron scheduled (weekdays at 08:00).");
}
