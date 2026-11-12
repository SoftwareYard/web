"use client";

import { cn } from "@/lib/utils";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { cmsApi } from "@/lib/cms-api";
import { ScanReceiptButton } from "@/components/ctrl/scan-receipt-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  ImageOff,
  Loader2,
  NotebookPen,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type PaymentMethod = "cash" | "card" | "mixed" | "unknown";
type Category = "restaurant" | "groceries" | "fuel" | "office" | "transport" | "utilities" | "other";

interface ReceiptItem {
  name: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
  vatGroup: string | null;
}

interface VatLine {
  group: string;
  ratePercent: number | null;
  vat: number;
}

interface Receipt {
  id: string;
  imageUrl: string | null; // null: entered by hand without a photo
  originalImageUrl: string | null;
  fileName: string | null;
  date: string; // ISO; only the YYYY-MM-DD part is meaningful
  dateSource: "scanned" | "upload" | "manual";
  time: string | null;
  total: number | null;
  merchantName: string | null;
  merchantAddress: string | null;
  merchantTaxNumber: string | null;
  merchantVatNumber: string | null;
  paymentMethod: PaymentMethod | null;
  category: Category | null;
  receiptNumber: string | null;
  fiscalCodes: string[];
  vatTotal: number | null;
  vatBreakdown: VatLine[] | null;
  items: ReceiptItem[] | null;
  duplicateOfId: string | null;
  scanError: string | null;
  scannedAt: string | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<Category, string> = {
  restaurant: "Restaurant",
  groceries: "Groceries",
  fuel: "Fuel",
  office: "Office",
  transport: "Transport",
  utilities: "Utilities",
  other: "Other",
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  mixed: "Cash + card",
  unknown: "Unknown",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const day = (r: Receipt) => r.date.slice(0, 10);

const formatAmount = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const formatMkd = (n: number) => `${formatAmount(n)} MKD`;

// "2026-11-06" -> "06.11.2026", the way it reads on the receipt
const formatDay = (ymd: string) => ymd.split("-").reverse().join(".");

const sum = (list: Receipt[], pick: (r: Receipt) => number | null) =>
  list.reduce((s, r) => s + (pick(r) ?? 0), 0);

// Why a receipt should be looked at by a person; empty when it's fine
const checkReasons = (r: Receipt) =>
  [
    r.dateSource === "upload" && "Date not read, filed under the upload day",
    r.total === null && "Total missing",
    r.duplicateOfId && "Possible duplicate",
    r.scanError && r.scanError,
  ].filter((x): x is string => !!x);

const needsCheck = (r: Receipt) => checkReasons(r).length > 0;

// Upload a few at a time; each upload waits for the scan
const UPLOAD_CONCURRENCY = 3;
const COLUMNS = 10;

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Receipt | null>(null);
  const [preview, setPreview] = useState<Receipt | null>(null);
  const [rescanning, setRescanning] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [onlyToCheck, setOnlyToCheck] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setReceipts(await cmsApi<Receipt[]>("/api/receipts"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load receipts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const years = useMemo(() => {
    const set = new Set(receipts.map((r) => day(r).slice(0, 4)));
    set.add(String(new Date().getFullYear()));
    return [...set].sort().reverse();
  }, [receipts]);

  // Months of the selected year, newest first
  const months = useMemo(() => {
    const byMonth = new Map<number, Receipt[]>();
    for (const r of receipts) {
      if (!day(r).startsWith(year)) continue;
      const month = parseInt(day(r).slice(5, 7), 10);
      byMonth.set(month, [...(byMonth.get(month) ?? []), r]);
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => b - a)
      .map(([month, list]) => ({
        month,
        receipts: list,
        total: sum(list, (r) => r.total),
        vat: sum(list, (r) => r.vatTotal),
      }));
  }, [receipts, year]);

  const yearReceipts = months.flatMap((m) => m.receipts);
  const yearTotal = sum(yearReceipts, (r) => r.total);
  const yearVat = sum(yearReceipts, (r) => r.vatTotal);
  const toCheck = yearReceipts.filter(needsCheck).length;

  // With the "Need checking" filter on, only flagged receipts are listed (stats stay for the whole year)
  const shownMonths = onlyToCheck
    ? months
        .map((m) => ({ ...m, receipts: m.receipts.filter(needsCheck) }))
        .filter((m) => m.receipts.length > 0)
    : months;

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const uploadOne = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API_URL}/api/receipts`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Upload of ${file.name} failed`);
    }
    return (await res.json()) as Receipt;
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!files.length) return;

    setUploading({ done: 0, total: files.length });
    const results: Receipt[] = [];
    const queue = [...files];
    await Promise.all(
      Array.from({ length: Math.min(UPLOAD_CONCURRENCY, files.length) }, async () => {
        for (let file = queue.shift(); file; file = queue.shift()) {
          try {
            results.push(await uploadOne(file));
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
          }
          setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
        }
      })
    );
    setUploading(null);
    if (!results.length) return;

    const unread = results.filter((r) => r.dateSource === "upload").length;
    const duplicates = results.filter((r) => r.duplicateOfId).length;
    toast.success(
      [
        `${results.length} receipt${results.length > 1 ? "s" : ""} uploaded`,
        unread && `${unread} without a readable date (filed under today, please check)`,
        duplicates && `${duplicates} look${duplicates === 1 ? "s" : ""} like a duplicate`,
      ]
        .filter(Boolean)
        .join(" · ")
    );
    // Jump to the year of the last upload so it's visible
    setYear(day(results[results.length - 1]).slice(0, 4));
    load();
  };

  const rescan = async (r: Receipt) => {
    setRescanning((prev) => new Set(prev).add(r.id));
    try {
      const updated = await cmsApi<Receipt>(`/api/receipts/${r.id}/rescan`, { method: "POST" });
      if (updated.scanError) toast.warning(`Rescanned: ${updated.scanError}`);
      else toast.success("Receipt rescanned");
      setEditing((e) => (e?.id === r.id ? updated : e));
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rescan failed");
    } finally {
      setRescanning((prev) => {
        const next = new Set(prev);
        next.delete(r.id);
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await cmsApi(`/api/receipts/${deleteId}`, { method: "DELETE" });
      toast.success("Receipt deleted");
      setDeleteId(null);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <CmsShell>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold">Receipts</h1>
        <ScanReceiptButton
          className="w-full sm:hidden h-14 text-base"
          onScanned={(r) => {
            setYear(r.date.slice(0, 4));
            load();
          }}
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
          <ScanReceiptButton
            size="default"
            className="hidden sm:inline-flex"
            onScanned={(r) => {
              setYear(r.date.slice(0, 4));
              load();
            }}
          />
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning {uploading.done}/{uploading.total}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload photos
              </>
            )}
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setManualOpen(true)}>
            <NotebookPen className="w-4 h-4 mr-2" />
            Enter manually
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label={`Total ${year}`} value={formatMkd(yearTotal)} />
        <StatCard label={`VAT ${year}`} value={formatMkd(yearVat)} />
        <StatCard label={`Receipts ${year}`} value={String(yearReceipts.length)} />
        <StatCard
          label="Need checking"
          value={String(toCheck)}
          hint={onlyToCheck ? "Showing only these · click to show all" : "Click to show only these"}
          onClick={() => setOnlyToCheck((v) => !v)}
          active={onlyToCheck}
          highlight={toCheck > 0}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : shownMonths.length === 0 ? (
        <p className="text-muted-foreground text-center py-12 border rounded-lg">
          {onlyToCheck ? `Nothing to check in ${year}` : `No receipts for ${year}`}
        </p>
      ) : (
        <div className="space-y-10">
          {shownMonths.map(({ month, receipts: list, total, vat }) => (
            <section key={month}>
              <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
                <h2 className="text-lg font-semibold">
                  {MONTHS[month - 1]} {year}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {list.length} receipt{list.length !== 1 ? "s" : ""} · VAT {formatMkd(vat)} ·{" "}
                  <span className="font-medium text-foreground">{formatMkd(total)}</span>
                </p>
              </div>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead className="w-16">Image</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Receipt no.</TableHead>
                      <TableHead className="text-right">VAT</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-28" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((r) => {
                      const open = expanded.has(r.id);
                      const reasons = checkReasons(r);
                      return (
                        <Fragment key={r.id}>
                          <TableRow className="cursor-pointer" onClick={() => toggle(r.id)}>
                            <TableCell>
                              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </TableCell>
                            <TableCell>
                              {r.imageUrl ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreview(r);
                                  }}
                                  aria-label="Show receipt image"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={r.imageUrl}
                                    alt={r.fileName ?? "Receipt"}
                                    loading="lazy"
                                    className="w-12 h-16 object-cover object-top rounded border bg-muted"
                                  />
                                </button>
                              ) : (
                                <div
                                  className="w-12 h-16 rounded border bg-muted flex items-center justify-center text-muted-foreground"
                                  title="Entered by hand, no photo"
                                >
                                  <ImageOff className="w-4 h-4" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {formatDay(day(r))}
                                {r.dateSource === "upload" && (
                                  <AlertTriangle className="w-4 h-4 text-amber-500" aria-label="Date not read" />
                                )}
                              </div>
                              {r.time && <div className="text-xs text-muted-foreground">{r.time}</div>}
                            </TableCell>
                            <TableCell className="min-w-48">
                              <div className="font-medium">{r.merchantName ?? "—"}</div>
                              {reasons.length > 0 && (
                                <div className="flex items-start gap-1 text-xs text-amber-600 mt-0.5">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                                  <span>{reasons.join(" · ")}</span>
                                </div>
                              )}
                              {r.merchantAddress && (
                                <div className="text-xs text-muted-foreground">{r.merchantAddress}</div>
                              )}
                              {r.merchantTaxNumber && (
                                <div className="text-xs text-muted-foreground">ЕДБ {r.merchantTaxNumber}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {r.category ? <Badge variant="secondary">{CATEGORY_LABELS[r.category]}</Badge> : "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {r.paymentMethod ? PAYMENT_LABELS[r.paymentMethod] : "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {r.receiptNumber ?? "—"}
                              {r.duplicateOfId && (
                                <Badge variant="destructive" className="ml-2">
                                  <Copy className="w-3 h-3 mr-1" />
                                  Duplicate?
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              {r.vatTotal !== null ? formatAmount(r.vatTotal) : "—"}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap font-medium">
                              {r.total !== null ? formatMkd(r.total) : <span className="text-amber-600">Missing</span>}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setEditing(r)} aria-label="Edit">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => rescan(r)}
                                  disabled={!r.imageUrl || rescanning.has(r.id)}
                                  aria-label="Rescan"
                                  title={r.imageUrl ? "Read the image again" : "No photo to scan"}
                                >
                                  <RefreshCw className={`w-4 h-4 ${rescanning.has(r.id) ? "animate-spin" : ""}`} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)} aria-label="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {open && (
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={COLUMNS}>
                                <ReceiptDetails receipt={r} />
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </section>
          ))}
        </div>
      )}

      {preview && (
        <Dialog open onOpenChange={(open) => !open && setPreview(null)}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {preview.merchantName ?? "Receipt"} · {formatDay(day(preview))}
              </DialogTitle>
            </DialogHeader>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.imageUrl ?? ""} alt={preview.fileName ?? "Receipt"} className="w-full rounded border" />
            {preview.originalImageUrl && (
              <a
                href={preview.originalImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm inline-flex items-center gap-1 text-primary hover:underline"
              >
                Original photo (uncropped) <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </DialogContent>
        </Dialog>
      )}

      {manualOpen && (
        <ManualDialog
          onClose={() => setManualOpen(false)}
          onSaved={(created) => {
            setManualOpen(false);
            setYear(day(created).slice(0, 4));
            load();
          }}
        />
      )}

      {editing && (
        <EditDialog
          key={editing.id + editing.scannedAt}
          receipt={editing}
          rescanning={rescanning.has(editing.id)}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setEditing(null);
            setYear(day(updated).slice(0, 4));
            load();
          }}
          onRescan={() => rescan(editing)}
          onDelete={() => setDeleteId(editing.id)}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              The receipt and its image will be removed. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CmsShell>
  );
}

function StatCard({
  label,
  value,
  hint,
  onClick,
  active,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  onClick?: () => void;
  active?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-pressed={onClick ? !!active : undefined}
      className={cn(
        onClick && "cursor-pointer hover:bg-muted/50 transition-colors",
        highlight && "border-amber-400",
        active && "ring-2 ring-amber-400"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function ReceiptDetails({ receipt: r }: { receipt: Receipt }) {
  const items = r.items ?? [];
  const vat = r.vatBreakdown ?? [];
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr] py-2">
      <div>
        <h3 className="text-sm font-semibold mb-2">Items</h3>
        {items.length ? (
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-left">
                <th className="font-normal pb-1">Item</th>
                <th className="font-normal pb-1 text-right">Qty</th>
                <th className="font-normal pb-1 text-right">Price</th>
                <th className="font-normal pb-1 text-right">Amount</th>
                <th className="font-normal pb-1 text-right">VAT</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1">{item.name}</td>
                  <td className="py-1 text-right">{item.quantity ?? "—"}</td>
                  <td className="py-1 text-right">{item.unitPrice !== null ? formatAmount(item.unitPrice) : "—"}</td>
                  <td className="py-1 text-right">{item.amount !== null ? formatAmount(item.amount) : "—"}</td>
                  <td className="py-1 text-right">{item.vatGroup ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground">No items read</p>
        )}
      </div>
      <div className="space-y-4 text-sm">
        <div>
          <h3 className="font-semibold mb-2">VAT</h3>
          {vat.length ? (
            <ul className="space-y-1">
              {vat.map((v) => (
                <li key={v.group} className="flex justify-between">
                  <span>
                    {v.group}
                    {v.ratePercent !== null && ` (${v.ratePercent}%)`}
                  </span>
                  <span>{formatAmount(v.vat)}</span>
                </li>
              ))}
              {r.vatTotal !== null && (
                <li className="flex justify-between border-t pt-1 font-medium">
                  <span>Total VAT</span>
                  <span>{formatAmount(r.vatTotal)}</span>
                </li>
              )}
            </ul>
          ) : (
            <p className="text-muted-foreground">No VAT read</p>
          )}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">VAT no.</dt>
          <dd>{r.merchantVatNumber ?? "—"}</dd>
          <dt className="text-muted-foreground">Fiscal codes</dt>
          <dd className="break-all">{r.fiscalCodes.length ? r.fiscalCodes.join(", ") : "—"}</dd>
          <dt className="text-muted-foreground">Photo</dt>
          <dd className="break-all">
            {r.imageUrl ? (
              <a
                href={r.originalImageUrl ?? r.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {r.originalImageUrl ? "Original photo (uncropped)" : r.fileName ?? "Photo"}{" "}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              "None (entered by hand)"
            )}
          </dd>
          <dt className="text-muted-foreground">Date</dt>
          <dd>
            {r.dateSource === "scanned" ? "Read from receipt" : r.dateSource === "manual" ? "Set by hand" : "Upload date (couldn't read)"}
          </dd>
        </dl>
        {r.duplicateOfId && (
          <p className="text-destructive">Same merchant, receipt number, date and total as an earlier upload.</p>
        )}
        {r.scanError && <p className="text-amber-600">Scan note: {r.scanError}</p>}
      </div>
    </div>
  );
}

function EditDialog({
  receipt,
  rescanning,
  onClose,
  onSaved,
  onRescan,
  onDelete,
}: {
  receipt: Receipt;
  rescanning: boolean;
  onClose: () => void;
  onSaved: (r: Receipt) => void;
  onRescan: () => void;
  onDelete: () => void;
}) {
  const [date, setDate] = useState(day(receipt));
  const [total, setTotal] = useState(receipt.total !== null ? String(receipt.total) : "");
  const [merchantName, setMerchantName] = useState(receipt.merchantName ?? "");
  const [category, setCategory] = useState<Category>(receipt.category ?? "other");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(receipt.paymentMethod ?? "unknown");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const amount = total.trim() === "" ? null : Number(total.trim().replace(",", "."));
    if (amount !== null && !Number.isFinite(amount)) {
      toast.error("Total must be a number");
      return;
    }
    setSaving(true);
    try {
      const updated = await cmsApi<Receipt>(`/api/receipts/${receipt.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(date !== day(receipt) ? { date } : {}),
          total: amount,
          merchantName,
          category,
          paymentMethod,
        }),
      });
      toast.success("Receipt updated");
      onSaved(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit receipt</DialogTitle>
        </DialogHeader>
        <div className={cn("grid gap-6", receipt.imageUrl && "md:grid-cols-[1fr_16rem]")}>
          {receipt.imageUrl && (
            <a href={receipt.imageUrl} target="_blank" rel="noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={receipt.imageUrl} alt={receipt.fileName ?? "Receipt"} className="w-full rounded border" />
            </a>
          )}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="receipt-date">Date</Label>
              <Input id="receipt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="receipt-total">Total (MKD)</Label>
              <Input
                id="receipt-total"
                inputMode="decimal"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="e.g. 2780"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="receipt-merchant">Merchant</Label>
              <Input id="receipt-merchant" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Payment</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {receipt.scanError && <p className="text-xs text-amber-600">Scan note: {receipt.scanError}</p>}
          </div>
        </div>
        <DialogFooter className="sm:justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="ghost" className="text-destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={onRescan} disabled={rescanning || !receipt.imageUrl}>
              <RefreshCw className={`w-4 h-4 mr-2 ${rescanning ? "animate-spin" : ""}`} />
              Rescan
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// For receipts too damaged or faded to scan: type in what's legible, optionally attach a photo
function ManualDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (r: Receipt) => void }) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Skopje" }).format(new Date());
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [total, setTotal] = useState("");
  const [vatTotal, setVatTotal] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [merchantTaxNumber, setMerchantTaxNumber] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("unknown");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Date is required");
      return;
    }
    if (!total.trim()) {
      toast.error("Total is required");
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      Object.entries({
        date,
        time,
        total,
        vatTotal,
        merchantName,
        merchantTaxNumber,
        receiptNumber,
        category,
        paymentMethod,
      }).forEach(([key, value]) => form.append(key, value));
      if (photo) form.append("image", photo);

      const res = await fetch(`${API_URL}/api/receipts/manual`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Save failed");
      }
      const created = (await res.json()) as Receipt;
      if (created.duplicateOfId) toast.warning("Receipt saved, but it looks like a duplicate");
      else toast.success("Receipt saved");
      onSaved(created);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enter receipt manually</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="manual-date">Date *</Label>
              <Input
                id="manual-date"
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-time">Time</Label>
              <Input id="manual-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-total">Total (MKD) *</Label>
              <Input
                id="manual-total"
                inputMode="decimal"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="e.g. 2780"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-vat">VAT (MKD)</Label>
              <Input
                id="manual-vat"
                inputMode="decimal"
                value={vatTotal}
                onChange={(e) => setVatTotal(e.target.value)}
                placeholder="optional"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="manual-merchant">Merchant</Label>
            <Input
              id="manual-merchant"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="e.g. ГЕНЕРАЛ ЛОРД ДООЕЛ"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="manual-tax">ЕДБ (tax no.)</Label>
              <Input
                id="manual-tax"
                inputMode="numeric"
                value={merchantTaxNumber}
                onChange={(e) => setMerchantTaxNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-number">Receipt no.</Label>
              <Input id="manual-number" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Payment</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="manual-photo">Photo (optional, kept as is, not scanned)</Label>
            <Input
              id="manual-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save receipt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
