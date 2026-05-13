"use client";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const invoiceSchema = z.object({
  issuerTitle: z.string().min(1, "Issuer title is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  paid: z.boolean().default(false),
  paidDate: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceData {
  id: string;
  issuerTitle: string;
  amount: number;
  paid: boolean;
  paidDate: string | null;
  dueDate: string;
  createdAt: string;
}

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InvoiceFormValues) => Promise<void>;
  defaultValues?: InvoiceData | null;
}

export function InvoiceForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: InvoiceFormProps) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      issuerTitle: "",
      amount: 0,
      paid: false,
      paidDate: "",
    },
    values: defaultValues
      ? {
          issuerTitle: defaultValues.issuerTitle,
          amount: defaultValues.amount,
          paid: defaultValues.paid,
          paidDate: defaultValues.paidDate
            ? defaultValues.paidDate.split("T")[0]
            : "",
        }
      : undefined,
  });

  const handleSubmit = async (values: InvoiceFormValues) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit Invoice" : "New Invoice"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="issuerTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issuer Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Company or person name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 items-end">
              <FormField
                control={form.control}
                name="paid"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 pb-1">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked && !form.getValues("paidDate")) {
                            form.setValue(
                              "paidDate",
                              new Date().toISOString().split("T")[0]
                            );
                          }
                          if (!checked) {
                            form.setValue("paidDate", "");
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Paid</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paidDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
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
