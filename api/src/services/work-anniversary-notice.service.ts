import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendSlackMessage } from "../lib/slack";

function yearsLabel(years: number): string {
  return `${years} year${years !== 1 ? "s" : ""}`;
}

const ANNIVERSARY_MESSAGE_TEMPLATES = [
  (name: string, years: number) => `:tada: Today *${name}* celebrates ${yearsLabel(years)} with us! Thank you for everything you do! :raised_hands:`,
  (name: string, years: number) => `:confetti_ball: Happy work anniversary, *${name}*! ${yearsLabel(years)} on the team and counting! :rocket:`,
  (name: string, years: number) => `:star2: ${yearsLabel(years)} ago today, *${name}* joined Software Yard. We're lucky to have you! :pray:`,
  (name: string, years: number) => `:trophy: Big milestone! *${name}* has been with us for ${yearsLabel(years)} today. Congrats and thank you! :clap:`,
  (name: string, years: number) => `:calendar: Mark the date: *${name}* is celebrating ${yearsLabel(years)} at Software Yard! Drop them a congrats! :tada:`,
  (name: string, years: number) => `:sparkles: Cheers to ${yearsLabel(years)} of great work, *${name}*! Here's to many more! :clinking_glasses:`,
  (name: string, years: number) => `:muscle: ${yearsLabel(years)} strong! Happy work anniversary, *${name}*! :partying_face:`,
  (name: string, years: number) => `:rocket: *${name}* hit ${yearsLabel(years)} with the team today! Thanks for being part of the journey! :heart:`,
  (name: string, years: number) => `:medal: Today marks ${yearsLabel(years)} since *${name}* joined us. Please join us in congratulating them! :balloon:`,
  (name: string, years: number) => `:hourglass_flowing_sand: Time flies! *${name}* has been part of Software Yard for ${yearsLabel(years)}. Happy anniversary! :gift:`,
];

function buildAnniversaryMessage(name: string, years: number): string {
  const template = ANNIVERSARY_MESSAGE_TEMPLATES[Math.floor(Math.random() * ANNIVERSARY_MESSAGE_TEMPLATES.length)];
  return template(name, years);
}

// hireDate is stored as a UTC-midnight calendar date, so it's read with the UTC getters.
// A 29 February hire date is celebrated on 28 February in non-leap years.
function isAnniversaryToday(hireDate: Date, today: Date): boolean {
  const year = today.getUTCFullYear();
  const isLeap = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;
  let month = hireDate.getUTCMonth();
  let day = hireDate.getUTCDate();
  if (month === 1 && day === 29 && !isLeap) day = 28;
  return month === today.getUTCMonth() && day === today.getUTCDate();
}

export async function checkTodaysWorkAnniversaries(): Promise<number> {
  const now = new Date();

  const members = await prisma.teamMember.findMany({
    where: { isActive: true, hireDate: { not: null } },
    select: { name: true, hireDate: true },
  });

  const anniversaries = members
    .filter((m) => isAnniversaryToday(m.hireDate!, now))
    .map((m) => ({ name: m.name, years: now.getUTCFullYear() - m.hireDate!.getUTCFullYear() }))
    // The hire day itself is not an anniversary
    .filter((m) => m.years >= 1);

  if (anniversaries.length === 0) {
    console.log("[work-anniversary-notice] No work anniversaries today.");
    return 0;
  }

  for (const m of anniversaries) {
    await sendSlackMessage(buildAnniversaryMessage(m.name, m.years), process.env.SLACK_GENERAL_WEBHOOK_URL);
  }

  console.log(`[work-anniversary-notice] Sent ${anniversaries.length} work anniversary message(s).`);
  return anniversaries.length;
}

export function startWorkAnniversaryNoticeCron() {
  cron.schedule(
    "0 11 * * *",
    () => {
      console.log("[work-anniversary-notice] Running daily work anniversary check...");
      checkTodaysWorkAnniversaries().catch((err) =>
        console.error("[work-anniversary-notice] Error:", err)
      );
    },
    { timezone: "Europe/Skopje" }
  );

  console.log("[work-anniversary-notice] Cron scheduled (daily at 11:00).");
}
