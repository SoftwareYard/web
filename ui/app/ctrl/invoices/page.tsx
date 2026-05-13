"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { InvoiceForm, InvoiceFormValues } from "@/components/ctrl/invoice-form";
import { cmsApi } from "@/lib/cms-api";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: string;
  issuerTitle: string;
  amount: number;
  paid: boolean;
  paidDate: string | null;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

function InvoicesPageInner() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [issuerSearch, setIssuerSearch] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(
    () => searchParams.get("overdue") === "true"
  );

  const loadInvoices = useCallback(async () => {
    const data = await cmsApi<Invoice[]>("/api/invoices");
    setInvoices(data);
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const filtered = useMemo(() => {
    const now = new Date();
    return invoices.filter((inv) => {
      const created = new Date(inv.createdAt);
      if (dateFrom && created < new Date(dateFrom)) return false;
      if (dateTo) {
        const toEnd = new Date(dateTo);
        toEnd.setHours(23, 59, 59, 999);
        if (created > toEnd) return false;
      }
      if (
        issuerSearch &&
        !inv.issuerTitle.toLowerCase().includes(issuerSearch.toLowerCase())
      )
        return false;
      if (overdueOnly && (inv.paid || new Date(inv.dueDate) >= now))
        return false;
      return true;
    });
  }, [invoices, dateFrom, dateTo, issuerSearch, overdueOnly]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, inv) => sum + inv.amount, 0),
    [filtered]
  );

  const handleCreate = async (values: InvoiceFormValues) => {
    await cmsApi("/api/invoices", {
      method: "POST",
      body: JSON.stringify(values),
    });
    toast.success("Invoice created");
    setFormOpen(false);
    loadInvoices();
  };

  const handleUpdate = async (values: InvoiceFormValues) => {
    if (!editing) return;
    await cmsApi(`/api/invoices/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    toast.success("Invoice updated");
    setEditing(null);
    loadInvoices();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await cmsApi(`/api/invoices/${deleteId}`, { method: "DELETE" });
    toast.success("Invoice deleted");
    setDeleteId(null);
    loadInvoices();
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setIssuerSearch("");
    setOverdueOnly(false);
  };

  const hasFilters = dateFrom || dateTo || issuerSearch || overdueOnly;

  return (
    <CmsShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <div className="flex items-end gap-4 mb-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <Label htmlFor="issuer-search">Issuer</Label>
          <Input
            id="issuer-search"
            placeholder="Search issuer..."
            value={issuerSearch}
            onChange={(e) => setIssuerSearch(e.target.value)}
            className="w-48"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="date-from">From</Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="date-to">To</Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        {overdueOnly && (
          <div className="flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-sm text-destructive">
            <AlertCircle className="w-3.5 h-3.5" />
            Overdue only
            <button onClick={() => setOverdueOnly(false)} className="ml-1">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear all
          </Button>
        )}
        {(hasFilters || invoices.length > 0) && (
          <p className="text-sm text-muted-foreground ml-auto self-end">
            {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} — Total:{" "}
            <span className="font-medium">€{totalAmount.toFixed(2)}</span>
          </p>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issuer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.issuerTitle}
                </TableCell>
                <TableCell>€{invoice.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={invoice.paid ? "default" : "outline"}>
                    {invoice.paid ? "Paid" : "Unpaid"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invoice.paidDate
                    ? new Date(invoice.paidDate).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(invoice)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(invoice.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  {hasFilters
                    ? "No invoices match the current filters"
                    : "No invoices yet"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <InvoiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      {editing && (
        <InvoiceForm
          open={true}
          onOpenChange={(open) => !open && setEditing(null)}
          onSubmit={handleUpdate}
          defaultValues={editing}
        />
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesPageInner />
    </Suspense>
  );
}
