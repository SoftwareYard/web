"use client";

import { useEffect } from "react";
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
import { Loader2 } from "lucide-react";

const clientSchema = z.object({
  title: z.string().min(1, "Title is required"),
  contractDate: z.string().min(1, "Contract date is required"),
  domain: z.string().min(1, "Domain is required"),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientData {
  id: string;
  title: string;
  contractDate: string;
  domain: string;
}

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ClientFormValues) => Promise<void>;
  defaultValues?: ClientData | null;
}

function toDateInputValue(val: unknown): string {
  if (!val) return "";
  const d = new Date(val as string);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function ClientForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { title: "", contractDate: "", domain: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: defaultValues?.title ?? "",
        contractDate: toDateInputValue(defaultValues?.contractDate),
        domain: defaultValues?.domain ?? "",
      });
    }
  }, [open, defaultValues, form]);

  const handleSubmit = async (values: ClientFormValues) => {
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit Client" : "New Client"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Client name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contractDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="client.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
