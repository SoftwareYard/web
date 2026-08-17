"use client";

import { useEffect, useState, useCallback } from "react";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { ClientForm, ClientFormValues } from "@/components/ctrl/client-form";
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

interface Client {
  id: string;
  title: string;
  contractDate: string;
  domain: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    const data = await cmsApi<Client[]>("/api/clients");
    setClients(data);
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleCreate = async (values: ClientFormValues) => {
    await cmsApi("/api/clients", {
      method: "POST",
      body: JSON.stringify(values),
    });
    toast.success("Client created");
    setFormOpen(false);
    loadClients();
  };

  const handleUpdate = async (values: ClientFormValues) => {
    if (!editing) return;
    await cmsApi(`/api/clients/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    toast.success("Client updated");
    setEditing(null);
    loadClients();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await cmsApi(`/api/clients/${deleteId}`, { method: "DELETE" });
    toast.success("Client deleted");
    setDeleteId(null);
    loadClients();
  };

  return (
    <CmsShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Contract Date</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(client.contractDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-muted-foreground">{client.domain}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(client)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(client.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No clients yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      {editing && (
        <ClientForm
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
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Team members assigned to this client will become unassigned.
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
