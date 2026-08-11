"use client";

import { useEffect, useState, useCallback } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import { TimeOffRequestForm, TimeOffFormValues } from "@/components/portal/time-off-request-form";
import { BasicInfoTab } from "@/components/portal/basic-info-tab";
import { cmsApi } from "@/lib/cms-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Balance {
  year: number;
  allowanceDays: number;
  carriedOverDays: number;
  totalAllowance: number;
  reservedDays: number;
  remainingDays: number;
}

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
}

interface Holiday {
  id: string;
  date: string;
  name: string;
}

const statusVariant: Record<RequestStatus, "secondary" | "default" | "destructive" | "outline"> = {
  Pending: "secondary",
  Approved: "default",
  Rejected: "destructive",
  Cancelled: "outline",
};

export default function PortalPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [requests, setRequests] = useState<TimeOffRequestRow[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const year = new Date().getFullYear();
    const [balanceData, requestsData, holidaysData] = await Promise.all([
      cmsApi<Balance>("/api/time-off/balance"),
      cmsApi<TimeOffRequestRow[]>("/api/time-off/my-requests"),
      cmsApi<Holiday[]>(`/api/public-holidays?year=${year}`),
    ]);
    setBalance(balanceData);
    setRequests(requestsData);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setHolidays(holidaysData.filter((h) => new Date(h.date) >= today));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (values: TimeOffFormValues) => {
    try {
      await cmsApi("/api/time-off", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Time off request submitted");
      setFormOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit request");
      throw err;
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await cmsApi(`/api/time-off/${cancelId}`, { method: "DELETE" });
      toast.success("Request cancelled");
      setCancelId(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel request");
    }
  };

  return (
    <PortalShell>
      <Tabs defaultValue="time-off">
        <TabsList className="mb-6">
          <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
          <TabsTrigger value="time-off">Time Off</TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info">
          <BasicInfoTab />
        </TabsContent>

        <TabsContent value="time-off">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Time Off</h1>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Request Time Off
            </Button>
          </div>

          {balance && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{balance.remainingDays} / {balance.totalAllowance} days remaining</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {balance.allowanceDays} base days
                  {balance.carriedOverDays > 0
                    ? ` + ${balance.carriedOverDays} carried over from last year`
                    : ""}{" "}
                  for {balance.year}. {balance.reservedDays} day(s) already pending or approved.
                </p>
              </CardContent>
            </Card>
          )}

          {holidays.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Upcoming Public Holidays</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {holidays.map((h) => (
                    <li key={h.id} className="flex justify-between text-muted-foreground">
                      <span>{h.name}</span>
                      <span>
                        {new Date(h.date).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Working Days</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
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
                    <TableCell>
                      {r.status === "Pending" && (
                        <Button variant="ghost" size="sm" onClick={() => setCancelId(r.id)}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No time off requests yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <TimeOffRequestForm
            open={formOpen}
            onOpenChange={setFormOpen}
            onSubmit={handleCreate}
            remainingDays={balance?.remainingDays ?? 0}
          />

          <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will withdraw your pending time off request.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Request</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel}>Cancel Request</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </PortalShell>
  );
}
