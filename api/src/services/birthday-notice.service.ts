import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendSlackMessage, sendSlackDM } from "../lib/slack";

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
    where: { isActive: true, dateOfBirth: { not: null } },
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
    where: { isActive: true, dateOfBirth: { not: null } },
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

const HEADS_UP_MESSAGE_TEMPLATES = [
  (name: string, date: string) => `Psst :shushing_face: it's *${name}*'s birthday on ${date}. Make sure you make their day! :birthday:`,
  (name: string, date: string) => `Heads up :eyes: *${name}* has a birthday coming up on ${date}. Get your best wishes ready! :tada:`,
  (name: string, date: string) => `Shh, don't tell :zipper_mouth_face: *${name}* celebrates their birthday on ${date}. Let's make it a great one! :balloon:`,
  (name: string, date: string) => `Quick reminder :alarm_clock: it's *${name}*'s birthday on ${date}. Don't forget to wish them well! :gift:`,
  (name: string, date: string) => `Secret mission :sleuth_or_spy: *${name}*'s birthday is on ${date}. Help us make their day special! :cake:`,
  (name: string, date: string) => `Mark your calendar :spiral_calendar_pad: *${name}* has a birthday on ${date}. A few kind words will go a long way! :confetti_ball:`,
];

function buildHeadsUpMessage(name: string, date: Date): string {
  const template = HEADS_UP_MESSAGE_TEMPLATES[Math.floor(Math.random() * HEADS_UP_MESSAGE_TEMPLATES.length)];
  const formatted = date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  return template(name, formatted);
}

const HEADS_UP_DAYS_AHEAD = 3;

// DMs every team member (except the birthday person) a few days ahead of a birthday
export async function sendBirthdayHeadsUps(): Promise<number> {
  const now = new Date();
  const birthday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + HEADS_UP_DAYS_AHEAD)
  );

  const members = await prisma.teamMember.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, dateOfBirth: true },
  });

  const birthdayMembers = members.filter(
    (m) =>
      m.dateOfBirth &&
      m.dateOfBirth.getUTCMonth() === birthday.getUTCMonth() &&
      m.dateOfBirth.getUTCDate() === birthday.getUTCDate()
  );

  if (birthdayMembers.length === 0) {
    console.log(`[birthday-notice] No birthdays in ${HEADS_UP_DAYS_AHEAD} days.`);
    return 0;
  }

  let sentCount = 0;
  for (const birthdayMember of birthdayMembers) {
    for (const recipient of members) {
      if (recipient.id === birthdayMember.id || !recipient.email) continue;
      try {
        const sent = await sendSlackDM(recipient.email, buildHeadsUpMessage(birthdayMember.name, birthday));
        if (sent) sentCount++;
      } catch (err) {
        console.error(`[birthday-notice] Failed to DM ${recipient.email}:`, err);
      }
    }
  }

  console.log(`[birthday-notice] Sent ${sentCount} birthday heads-up DM(s).`);
  return sentCount;
}

export function startBirthdayNoticeCron() {
  cron.schedule(
    "0 10 * * *",
    () => {
      console.log("[birthday-notice] Running daily birthday check...");
      checkTodaysBirthdays().catch((err) =>
        console.error("[birthday-notice] Error:", err)
      );
      sendBirthdayHeadsUps().catch((err) =>
        console.error("[birthday-notice] Heads-up error:", err)
      );
    },
    { timezone: "Europe/Skopje" }
  );

  console.log("[birthday-notice] Cron scheduled (daily at 10:00).");
}
