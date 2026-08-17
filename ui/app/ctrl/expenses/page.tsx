"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { ExpenseForm, ExpenseFormValues } from "@/components/ctrl/expense-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Expense {
  id: string;
  expenseTypeId: string;
  expenseType: { id: string; type: string };
  storeId: string;
  store: { id: string; title: string };
  amount: number;
  date: string;
}

interface ExpenseType {
  id: string;
  type: string;
}

interface Store {
  id: string;
  title: string;
}

function firstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
}

function lastDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(lastDayOfMonth());
  const [storeFilter, setStoreFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadFilterOptions = useCallback(async () => {
    const [types, storeList] = await Promise.all([
      cmsApi<ExpenseType[]>("/api/expense-types"),
      cmsApi<Store[]>("/api/stores"),
    ]);
    setExpenseTypes(types);
    setStores(storeList);
  }, []);

  const loadExpenses = useCallback(async () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (storeFilter !== "all") params.set("storeId", storeFilter);
    if (typeFilter !== "all") params.set("expenseTypeId", typeFilter);
    const data = await cmsApi<Expense[]>(`/api/expenses?${params.toString()}`);
    setExpenses(data);
  }, [dateFrom, dateTo, storeFilter, typeFilter]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const totalAmount = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const handleCreate = async (values: ExpenseFormValues) => {
    await cmsApi("/api/expenses", {
      method: "POST",
      body: JSON.stringify(values),
    });
    toast.success("Expense created");
    setFormOpen(false);
    loadExpenses();
  };

  const handleUpdate = async (values: ExpenseFormValues) => {
    if (!editing) return;
    await cmsApi(`/api/expenses/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    toast.success("Expense updated");
    setEditing(null);
    loadExpenses();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await cmsApi(`/api/expenses/${deleteId}`, { method: "DELETE" });
    toast.success("Expense deleted");
    setDeleteId(null);
    loadExpenses();
  };

  return (
    <CmsShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Expense
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total for selected range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalAmount.toLocaleString()} MKD</p>
        </CardContent>
      </Card>

      <div className="flex items-end gap-4 mb-4 flex-wrap">
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
        <div className="flex flex-col gap-1">
          <Label>Store</Label>
          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Stores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Type</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {expenseTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground ml-auto self-end">
          {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(expense.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-muted-foreground">{expense.expenseType.type}</TableCell>
                <TableCell className="text-muted-foreground">{expense.store.title}</TableCell>
                <TableCell>{expense.amount.toLocaleString()} MKD</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(expense)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(expense.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No expenses found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      {editing && (
        <ExpenseForm
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
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
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
