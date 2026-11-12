"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ScannedReceipt {
  id: string;
  date: string;
  dateSource: "scanned" | "upload" | "manual";
  total: number | null;
  merchantName: string | null;
  duplicateOfId: string | null;
}

// One tap on a phone: opens the rear camera, uploads the photo and reads it.
// On a desktop the same input opens a file picker.
export function ScanReceiptButton({
  onScanned,
  className,
  size = "lg",
}: {
  onScanned?: (receipt: ScannedReceipt) => void;
  className?: string;
  size?: "default" | "lg";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API_URL}/api/receipts`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Upload failed");
      }
      const receipt = (await res.json()) as ScannedReceipt;

      const date = receipt.date.slice(0, 10).split("-").reverse().join(".");
      const total = receipt.total !== null ? `${receipt.total.toLocaleString("en-US")} MKD` : "total not read";
      const summary = [receipt.merchantName, date, total].filter(Boolean).join(" · ");
      const warnings = [
        receipt.dateSource === "upload" && "date not read, filed under today",
        receipt.duplicateOfId && "looks like a duplicate",
      ].filter(Boolean);

      const notify = warnings.length ? toast.warning : toast.success;
      notify(`Receipt saved: ${summary}`, {
        description: warnings.length ? `Please check: ${warnings.join(", ")}` : undefined,
        action: onScanned ? undefined : { label: "View", onClick: () => router.push("/ctrl/receipts") },
      });
      onScanned?.(receipt);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <Button size={size} className={cn(className)} onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Reading receipt…
          </>
        ) : (
          <>
            <Camera className="w-5 h-5 mr-2" />
            Scan receipt
          </>
        )}
      </Button>
    </>
  );
}
