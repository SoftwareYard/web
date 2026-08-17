"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cmsApi } from "@/lib/cms-api";

interface Payrise {
  id: string;
  netSalary: number;
  grossSalary: number;
  date: string;
}

interface PayriseHistoryDialogProps {
  memberId: string | null;
  memberLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyForm = { netSalary: "", grossSalary: "", date: "" };

function formatEur(value: number) {
  return `${value.toLocaleString()} EUR`;
}

export function PayriseHistoryDialog({
  memberId,
  memberLabel,
  open,
  onOpenChange,
}: PayriseHistoryDialogProps) {
  const [payrises, setPayrises] = useState<Payrise[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!memberId) return;
    const data = await cmsApi<Payrise[]>(`/api/salaries/${memberId}/payrises`);
    setPayrises(data);
  };

  useEffect(() => {
    if (open && memberId) {
      load();
    }
    if (!open) {
      setEditingId(null);
      setForm(emptyForm);
      setDeleteId(null);
    }
  }, [open, memberId]);

  const startAdd = () => {
    setEditingId("new");
    setForm({ ...emptyForm, date: new Date().toISOString().split("T")[0] });
  };

  const startEdit = (p: Payrise) => {
    setEditingId(p.id);
    setForm({
      netSalary: String(p.netSalary),
      grossSalary: String(p.grossSalary),
      date: p.date.split("T")[0],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const save = async () => {
    if (!memberId || !form.netSalary || !form.grossSalary || !form.date) return;
    setLoading(true);
    try {
      if (editingId === "new") {
        await cmsApi(`/api/salaries/${memberId}/payrises`, {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Payrise added");
      } else if (editingId) {
        await cmsApi(`/api/salaries/payrises/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        toast.success("Payrise updated");
      }
      cancelEdit();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await cmsApi(`/api/salaries/payrises/${deleteId}`, { method: "DELETE" });
    toast.success("Payrise deleted");
    setDeleteId(null);
    load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payrise History — {memberLabel}</DialogTitle>
        </DialogHeader>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editingId === "new" && (
                <TableRow>
                  <TableCell>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="h-8 w-36"
                      autoFocus
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="Net"
                      value={form.netSalary}
                      onChange={(e) => setForm({ ...form, netSalary: e.target.value })}
                      className="h-8 w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="Gross"
                      value={form.grossSalary}
                      onChange={(e) => setForm({ ...form, grossSalary: e.target.value })}
                      className="h-8 w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={save} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {payrises.map((p) => (
                <TableRow key={p.id}>
                  {editingId === p.id ? (
                    <>
                      <TableCell>
                        <Input
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          className="h-8 w-36"
                          autoFocus
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={form.netSalary}
                          onChange={(e) => setForm({ ...form, netSalary: e.target.value })}
                          className="h-8 w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={form.grossSalary}
                          onChange={(e) => setForm({ ...form, grossSalary: e.target.value })}
                          className="h-8 w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={save} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={cancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="whitespace-nowrap">
                        {new Date(p.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatEur(p.netSalary)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatEur(p.grossSalary)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(p)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              {payrises.length === 0 && editingId !== "new" && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    No payrises recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {editingId === null && (
          <Button variant="outline" size="sm" onClick={startAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add Payrise
          </Button>
        )}

        {deleteId && (
          <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
            <span>Delete this payrise entry?</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
