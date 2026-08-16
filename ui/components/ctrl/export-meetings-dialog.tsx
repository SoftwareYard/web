"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cmsApi } from "@/lib/cms-api";
import { exportMeetingsToExcel, MeetingWithUser } from "@/lib/meeting-export";

interface ExportMeetingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportMeetingsDialog({ open, onOpenChange }: ExportMeetingsDialogProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const meetings = await cmsApi<MeetingWithUser[]>(
        `/api/team/meetings/export?${params.toString()}`
      );
      if (meetings.length === 0) {
        toast.error("No 1-on-1 meetings found in this date range");
        return;
      }
      const filename = `1-on-1-meetings${from ? `_${from}` : ""}${to ? `_${to}` : ""}.xlsx`;
      exportMeetingsToExcel(meetings, filename);
      toast.success("Export downloaded");
      onOpenChange(false);
    } catch {
      toast.error("Failed to export meetings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Export 1-on-1 Meetings</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Creates an Excel file with one sheet per team member, listing their 1-on-1
          meetings in the selected range. Leave dates empty to export all meetings.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="export-from">From</Label>
            <Input
              id="export-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="export-to">To</Label>
            <Input
              id="export-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleExport} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Export"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
