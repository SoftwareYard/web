import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendSlackMessage } from "../lib/slack";

export interface UpcomingBirthday {
  id: string;
  name: string;
  image: string;
  date: string;
  daysUntil: number;
}

// dateOfBirth is stored as a UTC-midnight calendar date, so month/day must be
// read with the UTC getters — the container's system clock is UTC, and using
// local getters here would silently break if that ever changes.
function nextOccurrence(dob: Date, from: Date): { date: Date; daysUntil: number } {
  const today = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  let next = new Date(Date.UTC(today.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate()));
  if (next < today) {
    next = new Date(Date.UTC(today.getUTCFullYear() + 1, dob.getUTCMonth(), dob.getUTCDate()));
  }
  const daysUntil = Math.round((next.getTime() - today.getTime()) / 86_400_000);
  return { date: next, daysUntil };
}

export async function getUpcomingBirthdays(windowDays = 7): Promise<UpcomingBirthday[]> {
  const members = await prisma.teamMember.findMany({
    where: { dateOfBirth: { not: null } },
    select: { id: true, name: true, image: true, dateOfBirth: true },
  });

  const now = new Date();
  return members
    .map((m) => {
      const { date, daysUntil } = nextOccurrence(m.dateOfBirth!, now);
      return { id: m.id, name: m.name, image: m.image, date: date.toISOString(), daysUntil };
    })
    .filter((b) => b.daysUntil <= windowDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

const BIRTHDAY_MESSAGE_TEMPLATES = [
  (name: string) => `:birthday: Today is *${name}*'s birthday! Drop by and wish them a happy birthday! :tada:`,
  (name: string) => `:tada: Everyone, it's *${name}*'s birthday today! Let's make their day — send some birthday love! :birthday:`,
  (name: string) => `:cake: Happy Birthday, *${name}*! :confetti_ball: Take a moment to wish them well today.`,
  (name: string) => `:balloon: *${name}* is celebrating a birthday today! Go say happy birthday! :gift:`,
  (name: string) => `:sparkles: Another trip around the sun for *${name}*! Wish them a very happy birthday! :birthday:`,
];

function buildBirthdayMessage(name: string): string {
  const template = BIRTHDAY_MESSAGE_TEMPLATES[Math.floor(Math.random() * BIRTHDAY_MESSAGE_TEMPLATES.length)];
  return template(name);
}

export async function checkTodaysBirthdays(): Promise<number> {
  const now = new Date();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();

  const members = await prisma.teamMember.findMany({
    where: { dateOfBirth: { not: null } },
    select: { name: true, dateOfBirth: true },
  });

  const birthdayMembers = members.filter(
    (m) => m.dateOfBirth!.getUTCMonth() === month && m.dateOfBirth!.getUTCDate() === day
  );

  if (birthdayMembers.length === 0) {
    console.log("[birthday-notice] No birthdays today.");
    return 0;
  }

  for (const m of birthdayMembers) {
    await sendSlackMessage(buildBirthdayMessage(m.name), process.env.SLACK_GENERAL_WEBHOOK_URL);
  }

  console.log(`[birthday-notice] Sent ${birthdayMembers.length} birthday message(s).`);
  return birthdayMembers.length;
}

export function startBirthdayNoticeCron() {
  cron.schedule(
    "0 9 * * *",
    () => {
      console.log("[birthday-notice] Running daily birthday check...");
      checkTodaysBirthdays().catch((err) =>
        console.error("[birthday-notice] Error:", err)
      );
    },
    { timezone: "Europe/Skopje" }
  );

  console.log("[birthday-notice] Cron scheduled (daily at 09:00).");
}
