"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { TimeOffRejectDialog } from "@/components/ctrl/time-off-reject-dialog";
import { HolidayForm, HolidayFormValues } from "@/components/ctrl/holiday-form";
import { AdminTimeOffForm, AdminTimeOffFormValues } from "@/components/ctrl/admin-time-off-form";
import { EmployeeTimeOffDialog } from "@/components/ctrl/employee-time-off-dialog";
import { cmsApi } from "@/lib/cms-api";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type RequestStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";
type RequestType = "Annual" | "Special";

interface TimeOffRequestRow {
  id: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string | null;
  type: RequestType;
  status: RequestStatus;
  reviewNote: string | null;
  createdAt: string;
  employee: { id: string; name: string; email: string | null };
  reviewedBy: { id: string; name: string } | null;
}

interface BalanceRow {
  employee: { id: string; name: string; email: string | null };
  year: number;
  allowanceDays: number;
  carriedOverDays: number;
  totalAllowance: number;
  reservedDays: number;
  remainingDays: number;
  specialDaysUsed: number;
}

interface Holiday {
  id: string;
  date: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
}

const statusVariant: Record<RequestStatus, "secondary" | "default" | "destructive" | "outline"> = {
  Pending: "secondary",
  Approved: "default",
  Rejected: "destructive",
  Cancelled: "outline",
};

export default function TimeOffAdminPage() {
  const { admin } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<TimeOffRequestRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [balanceYear, setBalanceYear] = useState(new Date().getFullYear());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());
  const [holidayFormOpen, setHolidayFormOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deleteHolidayId, setDeleteHolidayId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<BalanceRow["employee"] | null>(null);
  const [employeeRequests, setEmployeeRequests] = useState<TimeOffRequestRow[]>([]);

  useEffect(() => {
    if (admin && admin.role !== "SuperAdmin") {
      router.replace("/ctrl");
    }
  }, [admin, router]);

  const loadRequests = useCallback(async () => {
    const query = statusFilter !== "All" ? `?status=${statusFilter}` : "";
    const data = await cmsApi<TimeOffRequestRow[]>(`/api/time-off/admin/requests${query}`);
    setRequests(data);
  }, [statusFilter]);

  const loadBalances = useCallback(async () => {
    const data = await cmsApi<BalanceRow[]>(`/api/time-off/admin/balances?year=${balanceYear}`);
    setBalances(data);
  }, [balanceYear]);

  const loadHolidays = useCallback(async () => {
    const data = await cmsApi<Holiday[]>(`/api/public-holidays?year=${holidayYear}`);
    setHolidays(data);
  }, [holidayYear]);

  const loadEmployees = useCallback(async () => {
    const data = await cmsApi<Employee[]>("/api/team");
    setEmployees(data);
  }, []);

  const loadEmployeeRequests = useCallback(async (employeeId: string) => {
    const data = await cmsApi<TimeOffRequestRow[]>(
      `/api/time-off/admin/requests?employeeId=${employeeId}`
    );
    setEmployeeRequests(data);
  }, []);

  useEffect(() => {
    if (admin?.role === "SuperAdmin") {
      loadRequests();
    }
  }, [admin, loadRequests]);

  useEffect(() => {
    if (admin?.role === "SuperAdmin") {
      loadBalances();
    }
  }, [admin, loadBalances]);

  useEffect(() => {
    if (admin?.role === "SuperAdmin") {
      loadHolidays();
    }
  }, [admin, loadHolidays]);

  useEffect(() => {
    if (admin?.role === "SuperAdmin") {
      loadEmployees();
    }
  }, [admin, loadEmployees]);

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeRequests(selectedEmployee.id);
    }
  }, [selectedEmployee, loadEmployeeRequests]);

  const handleApprove = async (id: string) => {
    try {
      await cmsApi(`/api/time-off/admin/${id}/approve`, { method: "PUT" });
      toast.success("Request approved");
      loadRequests();
      loadBalances();
      if (selectedEmployee) loadEmployeeRequests(selectedEmployee.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve request");
    }
  };

  const handleReject = async (note: string) => {
    if (!rejectingId) return;
    try {
      await cmsApi(`/api/time-off/admin/${rejectingId}/reject`, {
        method: "PUT",
        body: JSON.stringify({ note }),
      });
      toast.success("Request rejected");
      setRejectingId(null);
      loadRequests();
      loadBalances();
      if (selectedEmployee) loadEmployeeRequests(selectedEmployee.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject request");
    }
  };

  const handleAddTimeOff = async (values: AdminTimeOffFormValues) => {
    try {
      await cmsApi("/api/time-off/admin", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Time off added");
      setAddFormOpen(false);
      loadRequests();
      loadBalances();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add time off");
      throw err;
    }
  };

  const handleDeleteRequest = async () => {
    if (!deleteRequestId) return;
    await cmsApi(`/api/time-off/admin/${deleteRequestId}`, { method: "DELETE" });
    toast.success("Entry deleted");
    setDeleteRequestId(null);
    loadRequests();
    loadBalances();
    if (selectedEmployee) loadEmployeeRequests(selectedEmployee.id);
  };

  const handleCreateHoliday = async (values: HolidayFormValues) => {
    try {
      await cmsApi("/api/public-holidays", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Holiday added");
      setHolidayFormOpen(false);
      loadHolidays();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add holiday");
      throw err;
    }
  };

  const handleUpdateHoliday = async (values: HolidayFormValues) => {
    if (!editingHoliday) return;
    try {
      await cmsApi(`/api/public-holidays/${editingHoliday.id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });
      toast.success("Holiday updated");
      setEditingHoliday(null);
      loadHolidays();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update holiday");
      throw err;
    }
  };

  const handleDeleteHoliday = async () => {
    if (!deleteHolidayId) return;
    await cmsApi(`/api/public-holidays/${deleteHolidayId}`, { method: "DELETE" });
    toast.success("Holiday deleted");
    setDeleteHolidayId(null);
    loadHolidays();
  };

  if (admin?.role !== "SuperAdmin") return null;

  return (
    <CmsShell>
      <h1 className="text-2xl font-bold mb-6">Time Off</h1>

      <Tabs defaultValue="requests">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <div className="flex items-center justify-between mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setAddFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Time Off
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Working Days</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewed By</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.employee.name}
                      <div className="text-xs text-muted-foreground">{r.employee.email || "—"}</div>
                    </TableCell>
                    <TableCell>{new Date(r.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(r.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{r.workingDays}</TableCell>
                    <TableCell>
                      <Badge variant={r.type === "Special" ? "outline" : "secondary"}>
                        {r.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.reason || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                      {r.status === "Rejected" && r.reviewNote && (
                        <p className="text-xs text-muted-foreground mt-1">{r.reviewNote}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.reviewedBy?.name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {r.status === "Pending" && (
                          <>
                            <Button size="sm" onClick={() => handleApprove(r.id)}>
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectingId(r.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteRequestId(r.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No time off requests
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="balances">
          <div className="flex items-center justify-between mb-4">
            <Input
              type="number"
              className="w-24"
              value={balanceYear}
              onChange={(e) => setBalanceYear(Number(e.target.value) || new Date().getFullYear())}
            />
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Carried Over</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Special Days Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((b) => (
                  <TableRow
                    key={b.employee.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedEmployee(b.employee)}
                  >
                    <TableCell className="font-medium">
                      {b.employee.name}
                      <div className="text-xs text-muted-foreground">{b.employee.email || "—"}</div>
                    </TableCell>
                    <TableCell>{b.allowanceDays}</TableCell>
                    <TableCell>{b.carriedOverDays}</TableCell>
                    <TableCell>{b.totalAllowance}</TableCell>
                    <TableCell>{b.reservedDays}</TableCell>
                    <TableCell>{b.remainingDays}</TableCell>
                    <TableCell className="text-muted-foreground">{b.specialDaysUsed}</TableCell>
                  </TableRow>
                ))}
                {balances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No employees yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="holidays">
          <div className="flex items-center justify-between mb-4">
            <Input
              type="number"
              className="w-24"
              value={holidayYear}
              onChange={(e) => setHolidayYear(Number(e.target.value) || new Date().getFullYear())}
            />
            <Button size="sm" onClick={() => setHolidayFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Holiday
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      {new Date(h.date).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingHoliday(h)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteHolidayId(h.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {holidays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No holidays added for {holidayYear}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <TimeOffRejectDialog
        open={!!rejectingId}
        onOpenChange={(open) => !open && setRejectingId(null)}
        onSubmit={handleReject}
      />

      <AdminTimeOffForm
        open={addFormOpen}
        onOpenChange={setAddFormOpen}
        onSubmit={handleAddTimeOff}
        employees={employees}
      />

      <EmployeeTimeOffDialog
        open={!!selectedEmployee}
        onOpenChange={(open) => !open && setSelectedEmployee(null)}
        employee={selectedEmployee}
        requests={employeeRequests}
        balanceSummary={balances.find((b) => b.employee.id === selectedEmployee?.id)}
        onApprove={handleApprove}
        onReject={setRejectingId}
        onDelete={setDeleteRequestId}
      />

      <AlertDialog
        open={!!deleteRequestId}
        onOpenChange={(open) => !open && setDeleteRequestId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes it from the employee&apos;s time off history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequest}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HolidayForm
        open={holidayFormOpen}
        onOpenChange={setHolidayFormOpen}
        onSubmit={handleCreateHoliday}
      />

      <HolidayForm
        open={!!editingHoliday}
        onOpenChange={(open) => !open && setEditingHoliday(null)}
        onSubmit={handleUpdateHoliday}
        defaultValues={
          editingHoliday
            ? { date: editingHoliday.date.split("T")[0], name: editingHoliday.name }
            : null
        }
      />

      <AlertDialog
        open={!!deleteHolidayId}
        onOpenChange={(open) => !open && setDeleteHolidayId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete holiday?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHoliday}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CmsShell>
  );
}
