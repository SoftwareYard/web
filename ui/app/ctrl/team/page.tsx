"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { TeamForm } from "@/components/ctrl/team-form";
import { ExportMeetingsDialog } from "@/components/ctrl/export-meetings-dialog";
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
import { Plus, Eye, Trash2, FileSpreadsheet, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  email: string | null;
  phone: string | null;
  hireDate: string | null;
  currentSalaryEur: number | null;
  nextContractDate: string | null;
  sortOrder: number;
  client: { id: string; title: string } | null;
}

function TeamPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(
    () => searchParams.get("overdue") === "true"
  );

  const loadMembers = useCallback(async () => {
    const data = await cmsApi<TeamMember[]>("/api/team");
    setMembers(data);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filtered = useMemo(() => {
    if (!overdueOnly) return members;
    const now = new Date();
    return members.filter(
      (m) => m.nextContractDate && new Date(m.nextContractDate) < now
    );
  }, [members, overdueOnly]);

  const handleCreate = async (formData: FormData) => {
    const res = await fetch(`${API_URL}/api/team`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to create");
    toast.success("Team member created");
    setFormOpen(false);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export 1-on-1s
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Member
          </Button>
        </div>
      </div>

      {overdueOnly && (
        <div className="flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-sm text-destructive w-fit mb-4">
          <AlertCircle className="w-3.5 h-3.5" />
          Overdue contracts only
          <button onClick={() => setOverdueOnly(false)} className="ml-1">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Next Contract Date</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((member) => {
              const isOverdue =
                !!member.nextContractDate &&
                new Date(member.nextContractDate) < new Date();
              return (
              <TableRow key={member.id}>
                <TableCell>
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-semibold text-muted-foreground/50">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {member.email || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.phone || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.client?.title || "—"}
                </TableCell>
                <TableCell className={isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                  {member.nextContractDate
                    ? new Date(member.nextContractDate).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/ctrl/team/${member.id}`)}
                    >
                      <Eye className="w-4 h-4" />
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
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  {overdueOnly ? "No overdue contracts" : "No team members yet"}
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

      <ExportMeetingsDialog open={exportOpen} onOpenChange={setExportOpen} />

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

export default function TeamPage() {
  return (
    <Suspense>
      <TeamPageInner />
    </Suspense>
  );
}
