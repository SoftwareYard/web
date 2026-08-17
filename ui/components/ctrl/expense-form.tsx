"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { cmsApi } from "@/lib/cms-api";

const expenseSchema = z.object({
  expenseTypeId: z.string().min(1, "Type is required"),
  storeId: z.string().min(1, "Store is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseData {
  id: string;
  expenseTypeId: string;
  storeId: string;
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

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
  defaultValues?: ExpenseData | null;
}

export function ExpenseForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: ExpenseFormProps) {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [addingType, setAddingType] = useState(false);
  const [newTypeInput, setNewTypeInput] = useState("");
  const [addingStore, setAddingStore] = useState(false);
  const [newStoreInput, setNewStoreInput] = useState("");

  const loadExpenseTypes = () =>
    cmsApi<ExpenseType[]>("/api/expense-types").then(setExpenseTypes).catch(() => {});
  const loadStores = () =>
    cmsApi<Store[]>("/api/stores").then(setStores).catch(() => {});

  useEffect(() => {
    if (open) {
      loadExpenseTypes();
      loadStores();
    }
  }, [open]);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaultValues
      ? {
          expenseTypeId: defaultValues.expenseTypeId,
          storeId: defaultValues.storeId,
          amount: defaultValues.amount,
          date: defaultValues.date.split("T")[0],
        }
      : {
          expenseTypeId: "",
          storeId: "",
          amount: 0,
          date: new Date().toISOString().split("T")[0],
        },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        defaultValues
          ? {
              expenseTypeId: defaultValues.expenseTypeId,
              storeId: defaultValues.storeId,
              amount: defaultValues.amount,
              date: defaultValues.date.split("T")[0],
            }
          : {
              expenseTypeId: "",
              storeId: "",
              amount: 0,
              date: new Date().toISOString().split("T")[0],
            }
      );
      setAddingType(false);
      setNewTypeInput("");
      setAddingStore(false);
      setNewStoreInput("");
    }
  }, [open, defaultValues, form]);

  const handleAddType = async () => {
    if (!newTypeInput.trim()) return;
    try {
      const created = await cmsApi<ExpenseType>("/api/expense-types", {
        method: "POST",
        body: JSON.stringify({ type: newTypeInput.trim() }),
      });
      await loadExpenseTypes();
      form.setValue("expenseTypeId", created.id);
      setNewTypeInput("");
      setAddingType(false);
    } catch {
      // type already exists or other error
    }
  };

  const handleAddStore = async () => {
    if (!newStoreInput.trim()) return;
    try {
      const created = await cmsApi<Store>("/api/stores", {
        method: "POST",
        body: JSON.stringify({ title: newStoreInput.trim() }),
      });
      await loadStores();
      form.setValue("storeId", created.id);
      setNewStoreInput("");
      setAddingStore(false);
    } catch {
      // other error
    }
  };

  const handleSubmit = async (values: ExpenseFormValues) => {
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit Expense" : "New Expense"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="expenseTypeId"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Type</FormLabel>
                    {!addingType && (
                      <button
                        type="button"
                        onClick={() => setAddingType(true)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="w-3 h-3" /> Add type
                      </button>
                    )}
                  </div>
                  {addingType ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="New type name"
                        value={newTypeInput}
                        onChange={(e) => setNewTypeInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddType())}
                        autoFocus
                      />
                      <Button type="button" size="sm" onClick={handleAddType}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => { setAddingType(false); setNewTypeInput(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storeId"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Store</FormLabel>
                    {!addingStore && (
                      <button
                        type="button"
                        onClick={() => setAddingStore(true)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="w-3 h-3" /> Add store
                      </button>
                    )}
                  </div>
                  {addingStore ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="New store name"
                        value={newStoreInput}
                        onChange={(e) => setNewStoreInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddStore())}
                        autoFocus
                      />
                      <Button type="button" size="sm" onClick={handleAddStore}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => { setAddingStore(false); setNewStoreInput(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select store" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stores.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (MKD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : defaultValues ? (
                  "Save Changes"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
