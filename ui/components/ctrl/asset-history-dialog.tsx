"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cmsApi } from "@/lib/cms-api";

interface AssetHistoryEntry {
  id: string;
  teamMember: { id: string; name: string };
  assignedAt: string;
  returnedAt: string | null;
}

interface AssetHistoryDialogProps {
  assetId: string | null;
  assetLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetHistoryDialog({
  assetId,
  assetLabel,
  open,
  onOpenChange,
}: AssetHistoryDialogProps) {
  const [history, setHistory] = useState<AssetHistoryEntry[]>([]);

  useEffect(() => {
    if (open && assetId) {
      cmsApi<AssetHistoryEntry[]>(`/api/assets/${assetId}/history`)
        .then(setHistory)
        .catch(() => {});
    }
    if (!open) setHistory([]);
  }, [open, assetId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>History — {assetLabel}</DialogTitle>
        </DialogHeader>

        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No usage history yet
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border rounded-lg px-3 py-2"
              >
                <div>
                  <p className="font-medium">{entry.teamMember.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.assignedAt).toLocaleDateString()}
                    {" — "}
                    {entry.returnedAt
                      ? new Date(entry.returnedAt).toLocaleDateString()
                      : "Present"}
                  </p>
                </div>
                {!entry.returnedAt && (
                  <span className="text-xs font-medium text-green-600">
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
