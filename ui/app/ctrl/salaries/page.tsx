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
import { PayriseHistoryDialog } from "@/components/ctrl/payrise-history-dialog";
import { Pencil, Check, X, History } from "lucide-react";
import { toast } from "sonner";

interface SalaryRow {
  id: string;
  name: string;
  role: string;
  currentSalaryEur: number | null;
  currentSalaryGross: number | null;
  invoiceValue: number | null;
  managementFee: number | null;
}

type EditableField = "invoiceValue" | "managementFee";

const fieldEndpoint: Record<EditableField, string> = {
  invoiceValue: "invoice-value",
  managementFee: "management-fee",
};

function formatEur(value: number | null) {
  return value !== null ? `${value.toLocaleString()} EUR` : "—";
}

function profitOf(row: SalaryRow) {
  if (row.invoiceValue === null || row.currentSalaryGross === null) return null;
  return row.invoiceValue - row.currentSalaryGross + (row.managementFee ?? 0);
}

export default function SalariesPage() {
  const { admin } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [historyRow, setHistoryRow] = useState<SalaryRow | null>(null);

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

  const startEdit = (row: SalaryRow, field: EditableField) => {
    setEditingId(row.id);
    setEditingField(field);
    setEditValue(row[field] !== null ? String(row[field]) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingId || !editingField) return;
    try {
      await cmsApi(`/api/salaries/${editingId}/${fieldEndpoint[editingField]}`, {
        method: "PUT",
        body: JSON.stringify({ [editingField]: editValue === "" ? null : editValue }),
      });
      toast.success("Updated");
      cancelEdit();
      loadRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  if (admin?.role !== "SuperAdmin") return null;

  const totalGross = rows.reduce((sum, row) => sum + (row.currentSalaryGross ?? 0), 0);
  const totalInvoice = rows.reduce((sum, row) => sum + (row.invoiceValue ?? 0), 0);
  const totalManagementFee = rows.reduce((sum, row) => sum + (row.managementFee ?? 0), 0);
  const totalProfit = totalInvoice - totalGross + totalManagementFee;

  return (
    <CmsShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Salaries</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Management Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalManagementFee.toLocaleString()} EUR</p>
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
              <TableHead>Management Fee</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead className="w-16">History</TableHead>
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
                  {editingId === row.id && editingField === "invoiceValue" ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 w-28"
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" onClick={saveEdit}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 group">
                      {formatEur(row.invoiceValue)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => startEdit(row, "invoiceValue")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === row.id && editingField === "managementFee" ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 w-28"
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" onClick={saveEdit}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 group">
                      {formatEur(row.managementFee)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => startEdit(row, "managementFee")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatEur(profitOf(row))}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setHistoryRow(row)}>
                    <History className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No employees yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PayriseHistoryDialog
        memberId={historyRow?.id ?? null}
        memberLabel={historyRow?.name ?? ""}
        open={!!historyRow}
        onOpenChange={(open) => !open && setHistoryRow(null)}
      />
    </CmsShell>
  );
}
