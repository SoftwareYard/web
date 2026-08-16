"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { AssetForm, AssetFormValues } from "@/components/ctrl/asset-form";
import { StoreForm, StoreFormValues } from "@/components/ctrl/store-form";
import { AssetImagesDialog } from "@/components/ctrl/asset-images-dialog";
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
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ImageIcon, History } from "lucide-react";
import { toast } from "sonner";

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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [holderFilter, setHolderFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [storeFormOpen, setStoreFormOpen] = useState(false);
  const [imagesAsset, setImagesAsset] = useState<Asset | null>(null);
  const [historyAsset, setHistoryAsset] = useState<Asset | null>(null);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    const data = await cmsApi<Asset[]>("/api/assets");
    setAssets(data);
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const assetTypeOptions = useMemo(
    () => Array.from(new Set(assets.map((a) => a.assetType.type))).sort(),
    [assets]
  );

  const holderOptions = useMemo(() => {
    const holders = new Map<string, string>();
    for (const a of assets) {
      if (a.currentHolder) holders.set(a.currentHolder.id, a.currentHolder.name);
    }
    return Array.from(holders, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [assets]);

  const filteredAssets = useMemo(
    () =>
      assets.filter((a) => {
        if (typeFilter !== "all" && a.assetType.type !== typeFilter) return false;
        if (holderFilter === "unassigned" && a.currentHolderId) return false;
        if (
          holderFilter !== "all" &&
          holderFilter !== "unassigned" &&
          a.currentHolderId !== holderFilter
        )
          return false;
        return true;
      }),
    [assets, typeFilter, holderFilter]
  );

  const handleCreateStore = async (values: StoreFormValues) => {
    await cmsApi("/api/stores", {
      method: "POST",
      body: JSON.stringify(values),
    });
    toast.success("Store created");
    setStoreFormOpen(false);
  };

  const handleCreate = async (values: AssetFormValues) => {
    await cmsApi("/api/assets", {
      method: "POST",
      body: JSON.stringify(values),
    });
    toast.success("Asset created");
    setFormOpen(false);
    loadAssets();
  };

  const handleUpdate = async (values: AssetFormValues) => {
    if (!editing) return;
    await cmsApi(`/api/assets/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    toast.success("Asset updated");
    setEditing(null);
    loadAssets();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await cmsApi(`/api/assets/${deleteId}`, { method: "DELETE" });
    toast.success("Asset deleted");
    setDeleteId(null);
    loadAssets();
  };

  return (
    <CmsShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Assets</h1>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {assetTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={holderFilter} onValueChange={setHolderFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {holderOptions.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setStoreFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Store
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Asset
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Current Holder</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">{asset.store.title}</TableCell>
                <TableCell className="text-muted-foreground">{asset.assetType.type}</TableCell>
                <TableCell className="text-muted-foreground">
                  {asset.serialNumber}
                </TableCell>
                <TableCell>{asset.amount.toLocaleString()} MKD</TableCell>
                <TableCell className="text-muted-foreground">
                  {asset.yearOfManufacture}
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
                      onClick={() => setImagesAsset(asset)}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
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
            {filteredAssets.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                >
                  No assets found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <StoreForm
        open={storeFormOpen}
        onOpenChange={setStoreFormOpen}
        onSubmit={handleCreateStore}
      />

      <AssetImagesDialog
        assetId={imagesAsset?.id ?? null}
        assetLabel={imagesAsset?.serialNumber ?? ""}
        open={!!imagesAsset}
        onOpenChange={(open) => !open && setImagesAsset(null)}
      />

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
      />

      <AssetForm
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={handleUpdate}
        defaultValues={editing}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
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
