import cron from "node-cron";
import { prisma } from "../lib/prisma";

async function renewInvoices() {
  const now = new Date();

  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const lastMonthInvoices = await prisma.invoice.findMany({
    where: {
      createdAt: {
        gte: firstOfLastMonth,
        lt: firstOfThisMonth,
      },
    },
  });

  if (lastMonthInvoices.length === 0) {
    console.log("[invoice-renewal] No invoices from last month to renew.");
    return;
  }

  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 7);

  await prisma.invoice.createMany({
    data: lastMonthInvoices.map((inv) => ({
      issuerTitle: inv.issuerTitle,
      amount: inv.amount,
      paid: false,
      dueDate,
    })),
  });

  console.log(`[invoice-renewal] Renewed ${lastMonthInvoices.length} invoice(s) for ${now.toLocaleString("default", { month: "long", year: "numeric" })}.`);
}

// Runs at 00:00 on the 5th of every month
export function startInvoiceRenewalCron() {
  cron.schedule("0 0 5 * *", () => {
    console.log("[invoice-renewal] Running monthly invoice renewal...");
    renewInvoices().catch((err) =>
      console.error("[invoice-renewal] Error:", err)
    );
  });

  console.log("[invoice-renewal] Cron scheduled (5th of every month).");
}
