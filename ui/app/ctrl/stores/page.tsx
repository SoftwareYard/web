"use client";

import { useEffect, useState, useCallback } from "react";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { StoreForm, StoreFormValues } from "@/components/ctrl/store-form";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Store {
  id: string;
  title: string;
  createdAt: string;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    const data = await cmsApi<Store[]>("/api/stores");
    setStores(data);
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleCreate = async (values: StoreFormValues) => {
    await cmsApi("/api/stores", {
      method: "POST",
      body: JSON.stringify(values),
    });
    toast.success("Store created");
    setFormOpen(false);
    loadStores();
  };

  const handleUpdate = async (values: StoreFormValues) => {
    if (!editing) return;
    await cmsApi(`/api/stores/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    toast.success("Store updated");
    setEditing(null);
    loadStores();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await cmsApi(`/api/stores/${deleteId}`, { method: "DELETE" });
      toast.success("Store deleted");
    } catch {
      toast.error("Cannot delete a store that has assets assigned to it");
    }
    setDeleteId(null);
    loadStores();
  };

  return (
    <CmsShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stores</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Store
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => (
              <TableRow key={store.id}>
                <TableCell className="font-medium">{store.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(store.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(store)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(store.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {stores.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground py-8"
                >
                  No stores yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <StoreForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      <StoreForm
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
            <AlertDialogTitle>Delete store?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Stores with assigned assets cannot be deleted.
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
