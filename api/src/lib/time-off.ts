import { prisma } from "./prisma";

export const ANNUAL_ALLOWANCE_DAYS = 20;
export const MAX_CARRYOVER_DAYS = 5;

const RESERVED_STATUSES = ["Pending", "Approved"] as const;

export function countWorkingDays(
  start: Date,
  end: Date,
  holidayDates: Set<string> = new Set()
): number {
  let count = 0;
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    const day = cursor.getUTCDay();
    const iso = cursor.toISOString().split("T")[0];
    if (day !== 0 && day !== 6 && !holidayDates.has(iso)) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

// A public holiday that falls on a Sunday is observed on the next working day
// (usually Monday), so that day is off too and must not count against the balance.
export function withObservedHolidays(holidayDates: Iterable<string>): Set<string> {
  const result = new Set(holidayDates);
  for (const observed of observedHolidayMap(result).keys()) result.add(observed);
  return result;
}

// Maps each observed day (ISO date) to the Sunday holiday (ISO date) it replaces.
export function observedHolidayMap(holidayDates: Iterable<string>): Map<string, string> {
  const taken = new Set(holidayDates);
  const observed = new Map<string, string>();
  for (const iso of [...taken].sort()) {
    const date = new Date(`${iso}T00:00:00.000Z`);
    if (date.getUTCDay() !== 0) continue;
    const cursor = new Date(date);
    do {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    } while (
      cursor.getUTCDay() === 0 ||
      cursor.getUTCDay() === 6 ||
      taken.has(cursor.toISOString().split("T")[0])
    );
    const observedIso = cursor.toISOString().split("T")[0];
    taken.add(observedIso);
    observed.set(observedIso, iso);
  }
  return observed;
}

export async function getHolidayDatesForYear(year: number): Promise<Set<string>> {
  const holidays = await prisma.publicHoliday.findMany({
    where: {
      date: {
        // Include the last week of the prior year so a Sunday Dec 31 holiday carries into Jan
        gte: new Date(Date.UTC(year - 1, 11, 25)),
        lt: new Date(Date.UTC(year + 1, 0, 1)),
      },
    },
  });
  return withObservedHolidays(holidays.map((h) => h.date.toISOString().split("T")[0]));
}

export function isSameCalendarYear(start: Date, end: Date): boolean {
  return start.getUTCFullYear() === end.getUTCFullYear();
}

export async function getReservedDays(
  employeeId: string,
  year: number
): Promise<number> {
  const result = await prisma.timeOffRequest.aggregate({
    where: {
      employeeId,
      type: "Annual",
      status: { in: [...RESERVED_STATUSES] },
      startDate: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1)),
      },
    },
    _sum: { workingDays: true },
  });
  return result._sum.workingDays ?? 0;
}

export async function getSpecialDaysUsed(
  employeeId: string,
  year: number
): Promise<number> {
  const result = await prisma.timeOffRequest.aggregate({
    where: {
      employeeId,
      type: "Special",
      status: { in: [...RESERVED_STATUSES] },
      startDate: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1)),
      },
    },
    _sum: { workingDays: true },
  });
  return result._sum.workingDays ?? 0;
}

export async function getOrCreateBalance(employeeId: string, year: number) {
  const existing = await prisma.timeOffBalance.findUnique({
    where: { employeeId_year: { employeeId, year } },
  });
  if (existing) return existing;

  const priorYear = await prisma.timeOffBalance.findUnique({
    where: { employeeId_year: { employeeId, year: year - 1 } },
  });

  let carriedOverDays = 0;
  if (priorYear) {
    const priorReserved = await getReservedDays(employeeId, year - 1);
    const priorLeftover =
      priorYear.allowanceDays + priorYear.carriedOverDays - priorReserved;
    carriedOverDays = Math.min(
      MAX_CARRYOVER_DAYS,
      Math.max(0, priorLeftover)
    );
  }

  return prisma.timeOffBalance.upsert({
    where: { employeeId_year: { employeeId, year } },
    update: {},
    create: {
      employeeId,
      year,
      allowanceDays: ANNUAL_ALLOWANCE_DAYS,
      carriedOverDays,
    },
  });
}

export async function computeRemainingBalance(employeeId: string, year: number) {
  const balance = await getOrCreateBalance(employeeId, year);
  const reservedDays = await getReservedDays(employeeId, year);
  const specialDaysUsed = await getSpecialDaysUsed(employeeId, year);
  const totalAllowance = balance.allowanceDays + balance.carriedOverDays;

  return {
    year,
    allowanceDays: balance.allowanceDays,
    carriedOverDays: balance.carriedOverDays,
    totalAllowance,
    reservedDays,
    remainingDays: totalAllowance - reservedDays,
    specialDaysUsed,
  };
}
