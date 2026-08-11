"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

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
  reviewedBy: { id: string; name: string } | null;
}

interface BalanceSummary {
  allowanceDays: number;
  carriedOverDays: number;
  totalAllowance: number;
  reservedDays: number;
  remainingDays: number;
  specialDaysUsed: number;
}

const statusVariant: Record<RequestStatus, "secondary" | "default" | "destructive" | "outline"> = {
  Pending: "secondary",
  Approved: "default",
  Rejected: "destructive",
  Cancelled: "outline",
};

interface EmployeeTimeOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: { id: string; name: string; email: string | null } | null;
  requests: TimeOffRequestRow[];
  balanceSummary?: BalanceSummary;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EmployeeTimeOffDialog({
  open,
  onOpenChange,
  employee,
  requests,
  balanceSummary,
  onApprove,
  onReject,
  onDelete,
}: EmployeeTimeOffDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee?.name} — Time Off History</DialogTitle>
        </DialogHeader>

        {balanceSummary && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-sm border rounded-lg p-3">
            <div>
              <p className="text-muted-foreground text-xs">Base</p>
              <p className="font-medium">{balanceSummary.allowanceDays}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Carried Over</p>
              <p className="font-medium">{balanceSummary.carriedOverDays}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total</p>
              <p className="font-medium">{balanceSummary.totalAllowance}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Reserved</p>
              <p className="font-medium">{balanceSummary.reservedDays}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Remaining</p>
              <p className="font-medium">{balanceSummary.remainingDays}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Special Used</p>
              <p className="font-medium">{balanceSummary.specialDaysUsed}</p>
            </div>
          </div>
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
                <TableHead>Reviewed By</TableHead>
                <TableHead>Requested On</TableHead>
                <TableHead className="w-40">Actions</TableHead>
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
                          <Button size="sm" onClick={() => onApprove(r.id)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onReject(r.id)}>
                            Reject
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => onDelete(r.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No time off history
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
