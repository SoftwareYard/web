import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendSlackMessage } from "../lib/slack";

export async function checkOverdueContracts() {
  const now = new Date();

  const overdueMembers = await prisma.teamMember.findMany({
    where: { nextContractDate: { lt: now } },
    orderBy: { nextContractDate: "asc" },
  });

  if (overdueMembers.length === 0) {
    console.log("[overdue-contracts] No overdue contracts.");
    return;
  }

  const lines = overdueMembers.map((m) => {
    const daysOverdue = Math.floor((now.getTime() - m.nextContractDate!.getTime()) / 86_400_000);
    return `• *${m.name}* — contract due ${m.nextContractDate!.toLocaleDateString("en-GB")} (${daysOverdue}d overdue)`;
  });

  const link = process.env.CORS_ORIGIN ? `${process.env.CORS_ORIGIN}/ctrl/team?overdue=true` : null;

  const text = [
    `:rotating_light: *${overdueMembers.length} team member${overdueMembers.length > 1 ? "s" : ""} with an unsigned/overdue contract*`,
    ...lines,
    ...(link ? [`<${link}|View in CMS>`] : []),
  ].join("\n");

  await sendSlackMessage(text);
  console.log(`[overdue-contracts] Sent Slack alert for ${overdueMembers.length} overdue contract(s).`);
}

// Runs at 08:00, Monday through Friday
export function startOverdueContractsCron() {
  cron.schedule("0 8 * * 1-5", () => {
    console.log("[overdue-contracts] Running overdue contracts check...");
    checkOverdueContracts().catch((err) =>
      console.error("[overdue-contracts] Error:", err)
    );
  });

  console.log("[overdue-contracts] Cron scheduled (weekdays at 08:00).");
}
