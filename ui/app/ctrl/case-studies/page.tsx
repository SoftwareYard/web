"use client";

import { useEffect, useState, useCallback } from "react";
import { CmsShell } from "@/components/ctrl/cms-shell";
import {
  CaseStudyForm,
  type CaseStudyPayload,
} from "@/components/ctrl/case-study-form";
import { cmsApi } from "@/lib/cms-api";
import type { CaseStudy } from "@/lib/clients";
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
import { ExternalLink, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CaseStudy | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadCaseStudies = useCallback(async () => {
    const data = await cmsApi<CaseStudy[]>("/api/case-studies?all=true");
    setCaseStudies(data);
  }, []);

  useEffect(() => {
    loadCaseStudies();
  }, [loadCaseStudies]);

  const handleCreate = async (values: CaseStudyPayload) => {
    try {
      await cmsApi("/api/case-studies", {
        method: "POST",
        body: JSON.stringify(values),
      });
    } catch (err) {
      toast.error((err as Error).message);
      throw err;
    }
    toast.success("Case study created");
    setFormOpen(false);
    loadCaseStudies();
  };

  const handleUpdate = async (values: CaseStudyPayload) => {
    if (!editing) return;
    try {
      await cmsApi(`/api/case-studies/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });
    } catch (err) {
      toast.error((err as Error).message);
      throw err;
    }
    toast.success("Case study updated");
    setEditing(null);
    loadCaseStudies();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await cmsApi(`/api/case-studies/${deleteId}`, { method: "DELETE" });
    toast.success("Case study deleted");
    setDeleteId(null);
    loadCaseStudies();
  };

  const nextSortOrder =
    caseStudies.reduce((max, c) => Math.max(max, c.sortOrder), -1) + 1;

  return (
    <CmsShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Case Studies</h1>
          <p className="text-sm text-muted-foreground">
            Shown on the public /clients page. Changes appear on the website
            within a minute.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Case Study
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Headline</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {caseStudies.map((caseStudy) => (
              <TableRow key={caseStudy.id}>
                <TableCell>{caseStudy.sortOrder}</TableCell>
                <TableCell className="font-medium">{caseStudy.name}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {caseStudy.headline}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{caseStudy.industry}</Badge>
                </TableCell>
                <TableCell>{caseStudy.steps.length}</TableCell>
                <TableCell>
                  <Badge variant={caseStudy.isActive ? "default" : "outline"}>
                    {caseStudy.isActive ? "Visible" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={`/clients/${caseStudy.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(caseStudy)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(caseStudy.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {caseStudies.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No case studies yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CaseStudyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        nextSortOrder={nextSortOrder}
      />

      {editing && (
        <CaseStudyForm
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
            <AlertDialogTitle>Delete case study?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from the website. This action cannot be undone.
              To hide it temporarily, edit it and turn off &quot;Visible on
              website&quot; instead.
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
