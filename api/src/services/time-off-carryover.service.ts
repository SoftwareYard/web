import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { getOrCreateBalance } from "../lib/time-off";

async function runYearlyCarryover() {
  const year = new Date().getFullYear();

  const employees = await prisma.teamMember.findMany({
    where: { password: { not: null } },
  });

  for (const employee of employees) {
    await getOrCreateBalance(employee.id, year);
  }

  console.log(
    `[time-off-carryover] Ensured ${year} balances for ${employees.length} employee(s).`
  );
}

// Runs at 00:05 on January 1st every year
export function startTimeOffCarryoverCron() {
  cron.schedule("5 0 1 1 *", () => {
    console.log("[time-off-carryover] Running yearly carryover...");
    runYearlyCarryover().catch((err) =>
      console.error("[time-off-carryover] Error:", err)
    );
  });

  console.log("[time-off-carryover] Cron scheduled (Jan 1 each year).");
}
