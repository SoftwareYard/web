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

const assetSchema = z.object({
  storeId: z.string().min(1, "Store is required"),
  assetTypeId: z.string().min(1, "Asset type is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  serialNumber: z.string().min(1, "Serial number is required"),
  yearOfManufacture: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear(), "Year cannot be in the future"),
  currentHolderId: z.string().optional(),
});

export type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetData {
  id: string;
  storeId: string;
  assetTypeId: string;
  purchaseDate: string;
  amount: number;
  serialNumber: string;
  yearOfManufacture: number;
  currentHolderId: string | null;
}

interface AssetType {
  id: string;
  type: string;
}

interface TeamMember {
  id: string;
  name: string;
}

interface Store {
  id: string;
  title: string;
}

interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AssetFormValues) => Promise<void>;
  defaultValues?: AssetData | null;
}

export function AssetForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: AssetFormProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [newTypeInput, setNewTypeInput] = useState("");
  const [addingType, setAddingType] = useState(false);

  const loadAssetTypes = () =>
    cmsApi<AssetType[]>("/api/asset-types").then(setAssetTypes).catch(() => {});

  useEffect(() => {
    if (open) {
      cmsApi<TeamMember[]>("/api/team").then(setMembers).catch(() => {});
      cmsApi<Store[]>("/api/stores").then(setStores).catch(() => {});
      loadAssetTypes();
    }
  }, [open]);

  const handleAddType = async () => {
    if (!newTypeInput.trim()) return;
    try {
      const created = await cmsApi<AssetType>("/api/asset-types", {
        method: "POST",
        body: JSON.stringify({ type: newTypeInput.trim() }),
      });
      await loadAssetTypes();
      form.setValue("assetTypeId", created.id);
      setNewTypeInput("");
      setAddingType(false);
    } catch {
      // type already exists or other error
    }
  };

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: defaultValues
      ? {
          storeId: defaultValues.storeId,
          assetTypeId: defaultValues.assetTypeId,
          purchaseDate: defaultValues.purchaseDate.split("T")[0],
          amount: defaultValues.amount,
          serialNumber: defaultValues.serialNumber,
          yearOfManufacture: defaultValues.yearOfManufacture,
          currentHolderId: defaultValues.currentHolderId ?? "",
        }
      : {
          storeId: "",
          assetTypeId: "",
          purchaseDate: new Date().toISOString().split("T")[0],
          amount: 0,
          serialNumber: "",
          yearOfManufacture: new Date().getFullYear(),
          currentHolderId: "",
        },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        defaultValues
          ? {
              storeId: defaultValues.storeId,
              assetTypeId: defaultValues.assetTypeId,
              purchaseDate: defaultValues.purchaseDate.split("T")[0],
              amount: defaultValues.amount,
              serialNumber: defaultValues.serialNumber,
              yearOfManufacture: defaultValues.yearOfManufacture,
              currentHolderId: defaultValues.currentHolderId ?? "",
            }
          : {
              storeId: "",
              assetTypeId: "",
              purchaseDate: new Date().toISOString().split("T")[0],
              amount: 0,
              serialNumber: "",
              yearOfManufacture: new Date().getFullYear(),
              currentHolderId: "",
            }
      );
      setAddingType(false);
      setNewTypeInput("");
    }
  }, [open, defaultValues, form]);

  const handleSubmit = async (values: AssetFormValues) => {
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit Asset" : "New Asset"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="storeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="SN-XXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assetTypeId"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Asset Type</FormLabel>
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
                        {assetTypes.map((t) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (MKD)</FormLabel>
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
              <FormField
                control={form.control}
                name="yearOfManufacture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year of Manufacture</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentHolderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Holder</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
