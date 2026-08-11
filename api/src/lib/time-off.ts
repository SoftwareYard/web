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

export async function getHolidayDatesForYear(year: number): Promise<Set<string>> {
  const holidays = await prisma.publicHoliday.findMany({
    where: {
      date: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1)),
      },
    },
  });
  return new Set(holidays.map((h) => h.date.toISOString().split("T")[0]));
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
