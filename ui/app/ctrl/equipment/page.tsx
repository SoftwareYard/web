"use client";

import { useEffect, useState, useCallback } from "react";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { AssetForm, AssetFormValues } from "@/components/ctrl/asset-form";
import { AssetHistoryDialog } from "@/components/ctrl/asset-history-dialog";
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
import { Plus, Pencil, Trash2, History } from "lucide-react";
import { toast } from "sonner";

const EQUIPMENT_TYPES = ["Laptop", "Monitor"];

interface Asset {
  id: string;
  storeId: string;
  store: { id: string; title: string };
  assetTypeId: string;
  assetType: { id: string; type: string };
  purchaseDate: string;
  amount: number;
  serialNumber: string;
  yearOfManufacture: number;
  currentHolderId: string | null;
  currentHolder: { id: string; name: string } | null;
  createdAt: string;
}

export default function EquipmentPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [historyAsset, setHistoryAsset] = useState<Asset | null>(null);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadEquipment = useCallback(async () => {
    const data = await cmsApi<Asset[]>("/api/assets");
    setAssets(data.filter((a) => EQUIPMENT_TYPES.includes(a.assetType.type)));
  }, []);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const handleCreate = async (values: AssetFormValues) => {
    await cmsApi("/api/assets", {
      method: "POST",
      body: JSON.stringify(values),
    });
    toast.success("Equipment created");
    setFormOpen(false);
    loadEquipment();
  };

  const handleUpdate = async (values: AssetFormValues) => {
    if (!editing) return;
    await cmsApi(`/api/assets/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    toast.success("Equipment updated");
    setEditing(null);
    loadEquipment();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await cmsApi(`/api/assets/${deleteId}`, { method: "DELETE" });
    toast.success("Equipment deleted");
    setDeleteId(null);
    loadEquipment();
  };

  return (
    <CmsShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Equipment</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Equipment
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Current Holder</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.assetType.type}</TableCell>
                <TableCell className="text-muted-foreground">
                  {asset.serialNumber}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(asset.purchaseDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {asset.currentHolder?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setHistoryAsset(asset)}
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(asset)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(asset.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {assets.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No equipment yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AssetHistoryDialog
        assetId={historyAsset?.id ?? null}
        assetLabel={historyAsset?.serialNumber ?? ""}
        open={!!historyAsset}
        onOpenChange={(open) => !open && setHistoryAsset(null)}
      />

      <AssetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        allowedTypes={EQUIPMENT_TYPES}
      />

      <AssetForm
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={handleUpdate}
        defaultValues={editing}
        allowedTypes={EQUIPMENT_TYPES}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete equipment?</AlertDialogTitle>
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
