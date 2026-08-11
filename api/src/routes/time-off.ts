import { Router, Response } from "express";
import { Resend } from "resend";
import { prisma } from "../lib/prisma";
import { requireAuth, requireSuperAdmin, AuthRequest } from "../middleware/auth";
import { requireTeamMemberAuth, PortalAuthRequest } from "../middleware/portal-auth";
import {
  countWorkingDays,
  isSameCalendarYear,
  computeRemainingBalance,
  getHolidayDatesForYear,
} from "../lib/time-off";

const resend = new Resend(process.env.RESEND_API_KEY);
export const timeOffRouter = Router();

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return isNaN(date.getTime()) ? null : date;
}

const requestSelect = {
  id: true,
  startDate: true,
  endDate: true,
  workingDays: true,
  reason: true,
  type: true,
  status: true,
  reviewNote: true,
  createdAt: true,
  updatedAt: true,
  employee: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true } },
};

async function notifySuperAdminsOfNewRequest(
  request: { startDate: Date; endDate: Date; workingDays: number; reason: string | null },
  employee: { name: string; email: string | null }
) {
  const superAdmins = await prisma.adminUser.findMany({
    where: { role: { name: "SuperAdmin" } },
  });
  if (superAdmins.length === 0) return;

  const { error } = await resend.emails.send({
    from: "SoftwareYard <noreply@softwareyard.co>",
    to: superAdmins.map((a) => a.email),
    subject: `New time off request from ${employee.name}`,
    html: `
      <h2>New Time Off Request</h2>
      <p><strong>Employee:</strong> ${employee.name} (${employee.email ?? "no email on file"})</p>
      <p><strong>Dates:</strong> ${request.startDate.toDateString()} - ${request.endDate.toDateString()}</p>
      <p><strong>Working days:</strong> ${request.workingDays}</p>
      <p><strong>Reason:</strong> ${request.reason || "N/A"}</p>
    `,
  });
  if (error) console.error("[time-off] Resend error:", error);
}

async function notifyEmployeeOfDecision(
  request: { startDate: Date; endDate: Date; reviewNote: string | null },
  employee: { name: string; email: string | null },
  decision: "Approved" | "Rejected"
) {
  if (!employee.email) return;

  const { error } = await resend.emails.send({
    from: "SoftwareYard <noreply@softwareyard.co>",
    to: employee.email,
    subject: `Your time off request was ${decision.toLowerCase()}`,
    html: `
      <h2>Time Off Request ${decision}</h2>
      <p>Hi ${employee.name},</p>
      <p>Your time off request for <strong>${request.startDate.toDateString()} - ${request.endDate.toDateString()}</strong> has been <strong>${decision.toLowerCase()}</strong>.</p>
      ${request.reviewNote ? `<p><strong>Note:</strong> ${request.reviewNote}</p>` : ""}
    `,
  });
  if (error) console.error("[time-off] Resend error:", error);
}

// --- Employee (portal) routes ---

timeOffRouter.get(
  "/balance",
  requireTeamMemberAuth,
  async (req: PortalAuthRequest, res: Response) => {
    const year = Number(req.query.year) || new Date().getFullYear();
    const balance = await computeRemainingBalance(req.teamMemberId!, year);
    res.json(balance);
  }
);

timeOffRouter.get(
  "/my-requests",
  requireTeamMemberAuth,
  async (req: PortalAuthRequest, res: Response) => {
    const year = req.query.year ? Number(req.query.year) : undefined;

    const requests = await prisma.timeOffRequest.findMany({
      where: {
        employeeId: req.teamMemberId,
        ...(year
          ? {
              startDate: {
                gte: new Date(Date.UTC(year, 0, 1)),
                lt: new Date(Date.UTC(year + 1, 0, 1)),
              },
            }
          : {}),
      },
      select: requestSelect,
      orderBy: { createdAt: "desc" },
    });

    res.json(requests);
  }
);

timeOffRouter.post("/", requireTeamMemberAuth, async (req: PortalAuthRequest, res: Response) => {
  const { startDate: startInput, endDate: endInput, reason } = req.body;

  const startDate = parseDate(startInput);
  const endDate = parseDate(endInput);

  if (!startDate || !endDate) {
    res.status(400).json({ error: "Start date and end date are required" });
    return;
  }

  if (endDate.getTime() < startDate.getTime()) {
    res.status(400).json({ error: "End date must be on or after start date" });
    return;
  }

  if (!isSameCalendarYear(startDate, endDate)) {
    res.status(400).json({
      error:
        "Time off requests cannot span multiple calendar years — please submit separate requests",
    });
    return;
  }

  const holidayDates = await getHolidayDatesForYear(startDate.getUTCFullYear());
  const workingDays = countWorkingDays(startDate, endDate, holidayDates);
  if (workingDays === 0) {
    res.status(400).json({ error: "Selected range contains no working days" });
    return;
  }

  const overlap = await prisma.timeOffRequest.findFirst({
    where: {
      employeeId: req.teamMemberId,
      status: { in: ["Pending", "Approved"] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  if (overlap) {
    res.status(409).json({
      error: "This request overlaps an existing pending or approved request",
    });
    return;
  }

  const { remainingDays } = await computeRemainingBalance(
    req.teamMemberId!,
    startDate.getUTCFullYear()
  );
  if (workingDays > remainingDays) {
    res.status(400).json({
      error: `Insufficient time off balance. You have ${remainingDays} day(s) remaining.`,
    });
    return;
  }

  const request = await prisma.timeOffRequest.create({
    data: {
      employeeId: req.teamMemberId!,
      startDate,
      endDate,
      workingDays,
      reason: reason || null,
    },
    select: requestSelect,
  });

  notifySuperAdminsOfNewRequest(request, request.employee).catch((err) =>
    console.error("[time-off] notify error", err)
  );

  res.status(201).json(request);
});

timeOffRouter.delete(
  "/:id",
  requireTeamMemberAuth,
  async (req: PortalAuthRequest, res: Response) => {
    const id = String(req.params.id);

    const request = await prisma.timeOffRequest.findUnique({ where: { id } });
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (request.employeeId !== req.teamMemberId) {
      res.status(403).json({ error: "You can only cancel your own requests" });
      return;
    }

    if (request.status !== "Pending") {
      res.status(400).json({ error: "Only pending requests can be cancelled" });
      return;
    }

    await prisma.timeOffRequest.update({
      where: { id },
      data: { status: "Cancelled" },
    });

    res.json({ success: true });
  }
);

// --- Admin (SuperAdmin) routes ---

timeOffRouter.get(
  "/admin/requests",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthRequest, res: Response) => {
    const { status, year } = req.query;

    const requests = await prisma.timeOffRequest.findMany({
      where: {
        ...(status ? { status: status as "Pending" | "Approved" | "Rejected" | "Cancelled" } : {}),
        ...(year
          ? {
              startDate: {
                gte: new Date(Date.UTC(Number(year), 0, 1)),
                lt: new Date(Date.UTC(Number(year) + 1, 0, 1)),
              },
            }
          : {}),
      },
      select: requestSelect,
      orderBy: { createdAt: "desc" },
    });

    res.json(requests);
  }
);

// Admin-entered records (historical backfill, or "Special" leave for weddings,
// funerals, etc.) are created pre-approved and skip the balance check — the
// SuperAdmin is trusting their own judgment, not asking themselves for approval.
timeOffRouter.post(
  "/admin",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthRequest, res: Response) => {
    const {
      employeeId,
      startDate: startInput,
      endDate: endInput,
      reason,
      type,
    } = req.body;

    if (!employeeId) {
      res.status(400).json({ error: "Employee is required" });
      return;
    }

    const employee = await prisma.teamMember.findUnique({ where: { id: employeeId } });
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const requestType = type === "Special" ? "Special" : "Annual";

    const startDate = parseDate(startInput);
    const endDate = parseDate(endInput);

    if (!startDate || !endDate) {
      res.status(400).json({ error: "Start date and end date are required" });
      return;
    }

    if (endDate.getTime() < startDate.getTime()) {
      res.status(400).json({ error: "End date must be on or after start date" });
      return;
    }

    if (!isSameCalendarYear(startDate, endDate)) {
      res.status(400).json({
        error:
          "Time off requests cannot span multiple calendar years — please add separate entries",
      });
      return;
    }

    const holidayDates = await getHolidayDatesForYear(startDate.getUTCFullYear());
    const workingDays = countWorkingDays(startDate, endDate, holidayDates);
    if (workingDays === 0) {
      res.status(400).json({ error: "Selected range contains no working days" });
      return;
    }

    const overlap = await prisma.timeOffRequest.findFirst({
      where: {
        employeeId,
        status: { in: ["Pending", "Approved"] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlap) {
      res.status(409).json({
        error: "This overlaps an existing pending or approved entry for this employee",
      });
      return;
    }

    const request = await prisma.timeOffRequest.create({
      data: {
        employeeId,
        startDate,
        endDate,
        workingDays,
        reason: reason || null,
        type: requestType,
        status: "Approved",
        reviewedById: req.adminId,
      },
      select: requestSelect,
    });

    res.status(201).json(request);
  }
);

timeOffRouter.delete(
  "/admin/:id",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);

    try {
      await prisma.timeOffRequest.delete({ where: { id } });
      res.json({ success: true });
    } catch {
      res.status(404).json({ error: "Request not found" });
    }
  }
);

timeOffRouter.get(
  "/admin/balances",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthRequest, res: Response) => {
    const year = Number(req.query.year) || new Date().getFullYear();

    const employees = await prisma.teamMember.findMany({
      orderBy: { createdAt: "asc" },
    });

    const balances = await Promise.all(
      employees.map(async (employee) => ({
        employee: { id: employee.id, name: employee.name, email: employee.email },
        ...(await computeRemainingBalance(employee.id, year)),
      }))
    );

    res.json(balances);
  }
);

timeOffRouter.put(
  "/admin/:id/approve",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);

    const existing = await prisma.timeOffRequest.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    if (existing.status !== "Pending") {
      res.status(400).json({ error: "Only pending requests can be approved" });
      return;
    }

    const request = await prisma.timeOffRequest.update({
      where: { id },
      data: { status: "Approved", reviewedById: req.adminId },
      select: requestSelect,
    });

    notifyEmployeeOfDecision(request, request.employee, "Approved").catch((err) =>
      console.error("[time-off] notify error", err)
    );

    res.json(request);
  }
);

timeOffRouter.put(
  "/admin/:id/reject",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const { note } = req.body;

    const existing = await prisma.timeOffRequest.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    if (existing.status !== "Pending") {
      res.status(400).json({ error: "Only pending requests can be rejected" });
      return;
    }

    const request = await prisma.timeOffRequest.update({
      where: { id },
      data: { status: "Rejected", reviewedById: req.adminId, reviewNote: note || null },
      select: requestSelect,
    });

    notifyEmployeeOfDecision(request, request.employee, "Rejected").catch((err) =>
      console.error("[time-off] notify error", err)
    );

    res.json(request);
  }
);
