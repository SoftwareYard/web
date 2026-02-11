"use client";

import { useEffect, useState, useCallback } from "react";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { JobForm } from "@/components/ctrl/job-form";
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

interface Job {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  postedDate: string;
  isActive: boolean;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    const data = await cmsApi<Job[]>("/api/jobs?all=true");
    setJobs(data);
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleCreate = async (values: Omit<Job, "id">) => {
    await cmsApi("/api/jobs", {
      method: "POST",
      body: JSON.stringify(values),
    });
    toast.success("Job created");
    setFormOpen(false);
    loadJobs();
  };

  const handleUpdate = async (values: Omit<Job, "id">) => {
    if (!editing) return;
    await cmsApi(`/api/jobs/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    toast.success("Job updated");
    setEditing(null);
    loadJobs();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await cmsApi(`/api/jobs/${deleteId}`, { method: "DELETE" });
    toast.success("Job deleted");
    setDeleteId(null);
    loadJobs();
  };

  return (
    <CmsShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Job Openings</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Job
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell>{job.department}</TableCell>
                <TableCell>{job.location}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{job.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={job.isActive ? "default" : "outline"}>
                    {job.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(job)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(job.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No job openings yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <JobForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />

      <JobForm
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
            <AlertDialogTitle>Delete job opening?</AlertDialogTitle>
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
