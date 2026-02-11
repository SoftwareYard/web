"use client";

import { useEffect, useState, useCallback } from "react";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { TeamForm, TeamFormValues } from "@/components/ctrl/team-form";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  sortOrder: number;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    const data = await cmsApi<TeamMember[]>("/api/team");
    setMembers(data);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleCreate = async (values: TeamFormValues) => {
    await cmsApi("/api/team", {
      method: "POST",
      body: JSON.stringify(values),
    });
    toast.success("Team member created");
    setFormOpen(false);
    loadMembers();
  };

  const handleUpdate = async (values: TeamFormValues) => {
    if (!editing) return;
    await cmsApi(`/api/team/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    toast.success("Team member updated");
    setEditing(null);
    loadMembers();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await cmsApi(`/api/team/${deleteId}`, { method: "DELETE" });
    toast.success("Team member deleted");
    setDeleteId(null);
    loadMembers();
  };

  return (
    <CmsShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team Members</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Member
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Bio</TableHead>
              <TableHead className="w-20">Order</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{member.role}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {member.bio}
                </TableCell>
                <TableCell>{member.sortOrder}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(member)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No team members yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TeamForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      <TeamForm
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
            <AlertDialogTitle>Delete team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CmsShell>
  );
}
