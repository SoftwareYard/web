import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendSlackMessage } from "../lib/slack";
import { observedHolidayMap } from "../lib/time-off";

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(date: Date): { day: string; formattedDate: string } {
  return {
    day: date.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" }),
    formattedDate: date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
  };
}

export interface NonWorkingDay {
  date: string; // ISO date of the day off
  name: string;
  observedFrom: string | null; // ISO date of the Sunday holiday it replaces, if any
}

function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function isoAddDays(iso: string, days: number): string {
  const d = utcDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

// Holidays plus observed days (Sunday holiday → next working day) between from and to, inclusive.
async function loadNonWorkingDays(from: string, to: string): Promise<NonWorkingDay[]> {
  // Look back a week so a Sunday holiday observed inside the range is included
  const holidays = await prisma.publicHoliday.findMany({
    where: { date: { gte: utcDate(isoAddDays(from, -7)), lt: utcDate(isoAddDays(to, 1)) } },
  });
  const nameByIso = new Map(holidays.map((h) => [h.date.toISOString().split("T")[0], h.name]));

  const days: NonWorkingDay[] = [...nameByIso].map(([date, name]) => ({
    date,
    name,
    observedFrom: null,
  }));
  for (const [date, source] of observedHolidayMap(nameByIso.keys())) {
    days.push({ date, name: nameByIso.get(source)!, observedFrom: source });
  }

  return days
    .filter((d) => d.date >= from && d.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getNextNonWorkingDay(): Promise<NonWorkingDay | null> {
  const tomorrow = toIsoDate(addDays(new Date(), 1));
  const days = await loadNonWorkingDays(tomorrow, isoAddDays(tomorrow, 366));
  // A holiday on a weekend is not a day off from work; a Sunday one is announced via its observed day
  return days.find((d) => ![0, 6].includes(utcDate(d.date).getUTCDay())) ?? null;
}

export function buildHolidayMessage(day: NonWorkingDay): string {
  const { day: weekday, formattedDate } = formatDate(utcDate(day.date));
  let intro = `Please be informed that ${weekday}, ${formattedDate}, is a public holiday, “${day.name}”, and is therefore considered a non-working day.`;
  if (day.observedFrom) {
    const from = formatDate(utcDate(day.observedFrom));
    intro = `Please be informed that ${weekday}, ${formattedDate}, is a non-working day, as the public holiday “${day.name}” falls on ${from.day}, ${from.formattedDate}.`;
  }
  return `Hi team,\n\n${intro}\n\nPlease make sure to inform the client you are working with about the upcoming holiday.\n\nEnjoy your holiday!`;
}

export async function sendHolidayNotice(day: NonWorkingDay) {
  await sendSlackMessage(buildHolidayMessage(day), process.env.SLACK_GENERAL_WEBHOOK_URL);
  console.log(
    `[holiday-notice] Sent notice for "${day.name}" on ${day.date}${day.observedFrom ? " (observed)" : ""}.`
  );
}

// Monday (1) looks ahead to Wed/Thu/Fri of the same week.
// Thursday (4) looks ahead to Mon/Tue of the following week.
function candidateOffsets(dayOfWeek: number): number[] {
  if (dayOfWeek === 1) return [2, 3, 4];
  if (dayOfWeek === 4) return [4, 5];
  return [];
}

export async function checkUpcomingHolidays() {
  const now = new Date();
  const offsets = candidateOffsets(now.getDay());
  if (offsets.length === 0) return;

  const days = await loadNonWorkingDays(
    toIsoDate(addDays(now, offsets[0])),
    toIsoDate(addDays(now, offsets[offsets.length - 1]))
  );
  for (const day of days) {
    await sendHolidayNotice(day);
  }
}

// Runs at 10:00 on Monday and Thursday
export function startHolidayNoticeCron() {
  cron.schedule(
    "0 10 * * 1,4",
    () => {
      console.log("[holiday-notice] Running upcoming holiday check...");
      checkUpcomingHolidays().catch((err) =>
        console.error("[holiday-notice] Error:", err)
      );
    },
    { timezone: "Europe/Skopje" }
  );

  console.log("[holiday-notice] Cron scheduled (Mon & Thu at 10:00).");
}
