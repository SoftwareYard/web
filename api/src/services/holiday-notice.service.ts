import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendSlackMessage } from "../lib/slack";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function buildHolidayMessage(date: Date, name: string): string {
  const day = date.toLocaleDateString("en-GB", { weekday: "long" });
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `Hi team,\n\nPlease be informed that ${day}, ${formattedDate}, is a public holiday, “${name}”, and is therefore considered a non-working day.\n\nPlease make sure to inform the client you are working with about the upcoming holiday.\n\nEnjoy your holiday!`;
}

// Monday (1) looks ahead to Wed/Thu/Fri of the same week.
// Friday (5) looks ahead to Mon/Tue of the following week.
function candidateOffsets(dayOfWeek: number): number[] {
  if (dayOfWeek === 1) return [2, 3, 4];
  if (dayOfWeek === 5) return [3, 4];
  return [];
}

export async function checkUpcomingHolidays() {
  const now = new Date();
  const offsets = candidateOffsets(now.getDay());
  if (offsets.length === 0) return;

  for (const offset of offsets) {
    const date = startOfDay(addDays(now, offset));
    const nextDay = addDays(date, 1);

    const holiday = await prisma.publicHoliday.findFirst({
      where: { date: { gte: date, lt: nextDay } },
    });
    if (!holiday) continue;

    const text = buildHolidayMessage(holiday.date, holiday.name);
    await sendSlackMessage(text, process.env.SLACK_GENERAL_WEBHOOK_URL);
    console.log(
      `[holiday-notice] Sent notice for "${holiday.name}" on ${holiday.date.toDateString()}.`
    );
  }
}

// Runs at 10:00 on Monday and Friday
export function startHolidayNoticeCron() {
  cron.schedule("0 10 * * 1,5", () => {
    console.log("[holiday-notice] Running upcoming holiday check...");
    checkUpcomingHolidays().catch((err) =>
      console.error("[holiday-notice] Error:", err)
    );
  });

  console.log("[holiday-notice] Cron scheduled (Mon & Fri at 10:00).");
}
