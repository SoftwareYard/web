"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { cmsApi } from "@/lib/cms-api";
import { useAuth } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface SalaryRow {
  id: string;
  name: string;
  role: string;
  currentSalaryEur: number | null;
  currentSalaryGross: number | null;
  invoiceValue: number | null;
}

function formatEur(value: number | null) {
  return value !== null ? `${value.toLocaleString()} EUR` : "—";
}

function profitOf(row: SalaryRow) {
  if (row.invoiceValue === null || row.currentSalaryGross === null) return null;
  return row.invoiceValue - row.currentSalaryGross;
}

export default function SalariesPage() {
  const { admin } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (admin && admin.role !== "SuperAdmin") {
      router.replace("/ctrl");
    }
  }, [admin, router]);

  const loadRows = useCallback(async () => {
    const data = await cmsApi<SalaryRow[]>("/api/salaries");
    setRows(data);
  }, []);

  useEffect(() => {
    if (admin?.role === "SuperAdmin") {
      loadRows();
    }
  }, [admin, loadRows]);

  const startEdit = (row: SalaryRow) => {
    setEditingId(row.id);
    setEditValue(row.invoiceValue !== null ? String(row.invoiceValue) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = async (id: string) => {
    try {
      await cmsApi(`/api/salaries/${id}/invoice-value`, {
        method: "PUT",
        body: JSON.stringify({ invoiceValue: editValue === "" ? null : editValue }),
      });
      toast.success("Invoice value updated");
      setEditingId(null);
      setEditValue("");
      loadRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  if (admin?.role !== "SuperAdmin") return null;

  const totalGross = rows.reduce((sum, row) => sum + (row.currentSalaryGross ?? 0), 0);
  const totalInvoice = rows.reduce((sum, row) => sum + (row.invoiceValue ?? 0), 0);
  const totalProfit = totalInvoice - totalGross;

  return (
    <CmsShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Salaries</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gross</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalGross.toLocaleString()} EUR</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalInvoice.toLocaleString()} EUR</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalProfit.toLocaleString()} EUR</p>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Net (EUR)</TableHead>
              <TableHead>Gross (EUR)</TableHead>
              <TableHead>Invoice Value</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-muted-foreground">{row.role}</TableCell>
                <TableCell className="text-muted-foreground">{formatEur(row.currentSalaryEur)}</TableCell>
                <TableCell className="text-muted-foreground">{formatEur(row.currentSalaryGross)}</TableCell>
                <TableCell>
                  {editingId === row.id ? (
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 w-32"
                      autoFocus
                    />
                  ) : (
                    formatEur(row.invoiceValue)
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatEur(profitOf(row))}</TableCell>
                <TableCell>
                  {editingId === row.id ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => saveEdit(row.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => startEdit(row)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No employees yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </CmsShell>
  );
}
