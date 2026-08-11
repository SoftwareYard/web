"use client";

import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cmsApi } from "@/lib/cms-api";
import { Loader2 } from "lucide-react";

interface Holiday {
  date: string;
  name: string;
}

export interface TimeOffFormValues {
  startDate: string;
  endDate: string;
  reason?: string;
}

interface TimeOffRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TimeOffFormValues) => Promise<void>;
  remainingDays: number;
}

function parseHolidayDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function countWorkingDays(range: DateRange | undefined, holidayDates: Set<string>): number {
  if (!range?.from || !range?.to) return 0;
  let count = 0;
  const cursor = new Date(range.from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(range.to);
  end.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= end.getTime()) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6 && !holidayDates.has(format(cursor, "yyyy-MM-dd"))) {
      count++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function TimeOffRequestForm({
  open,
  onOpenChange,
  onSubmit,
  remainingDays,
}: TimeOffRequestFormProps) {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const year = new Date().getFullYear();
    Promise.all([
      cmsApi<Holiday[]>(`/api/public-holidays?year=${year}`),
      cmsApi<Holiday[]>(`/api/public-holidays?year=${year + 1}`),
    ])
      .then(([a, b]) => setHolidays([...a, ...b]))
      .catch(() => setHolidays([]));
  }, [open]);

  const holidayDates = useMemo(
    () => new Set(holidays.map((h) => h.date.slice(0, 10))),
    [holidays]
  );
  const holidayCalendarDates = useMemo(
    () => holidays.map((h) => parseHolidayDate(h.date)),
    [holidays]
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const workingDays = useMemo(() => countWorkingDays(range, holidayDates), [range, holidayDates]);
  const exceedsBalance = workingDays > remainingDays;

  const handleSubmit = async () => {
    if (!range?.from || !range?.to) {
      setError("Please select a date range");
      return;
    }
    if (workingDays === 0) {
      setError("Selected range contains no working days");
      return;
    }
    if (exceedsBalance) {
      setError(`You only have ${remainingDays} day(s) available`);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        startDate: format(range.from, "yyyy-MM-dd"),
        endDate: format(range.to, "yyyy-MM-dd"),
        reason: reason || undefined,
      });
      setRange(undefined);
      setReason("");
    } catch {
      // parent surfaces the error via toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Time Off</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              disabled={{ before: today }}
              modifiers={{ holiday: holidayCalendarDates }}
              modifiersClassNames={{
                holiday: "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold",
              }}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2.5 rounded-full bg-amber-500/60" />
            Public holiday
          </div>

          <div className="rounded-md border p-3 text-sm space-y-0.5">
            <p>
              <span className="font-medium">{workingDays}</span> working day
              {workingDays === 1 ? "" : "s"} requested
            </p>
            <p className={exceedsBalance ? "text-destructive" : "text-muted-foreground"}>
              {remainingDays} day{remainingDays === 1 ? "" : "s"} available
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g. Family vacation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !range?.from || !range?.to || workingDays === 0 || exceedsBalance}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
