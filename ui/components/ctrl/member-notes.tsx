"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cmsApi } from "@/lib/cms-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MemberNote {
  id: string;
  date: string;
  hrNotes: string | null;
  memberNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const noteSchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    hrNotes: z.string(),
    memberNotes: z.string(),
  })
  .refine((v) => v.hrNotes.trim() || v.memberNotes.trim(), {
    message: "Add HR notes or member notes",
    path: ["hrNotes"],
  });

type NoteFormValues = z.infer<typeof noteSchema>;

const today = () => new Date().toISOString().split("T")[0];

function formatDate(val: string) {
  return new Date(val).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function NoteFormDialog({
  open,
  onOpenChange,
  note,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: MemberNote | null;
  onSubmit: (values: NoteFormValues) => Promise<void>;
}) {
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { date: today(), hrNotes: "", memberNotes: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      note
        ? {
            date: note.date.split("T")[0],
            hrNotes: note.hrNotes ?? "",
            memberNotes: note.memberNotes ?? "",
          }
        : { date: today(), hrNotes: "", memberNotes: "" }
    );
  }, [open, note, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? "Edit Note" : "New Note"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="w-48">
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hrNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HR Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={6} placeholder="What HR observed or discussed..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memberNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={6} placeholder="What the member said or asked for..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : note ? (
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

function NotePreviewDialog({
  note,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  note: MemberNote | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (note: MemberNote) => void;
  onDelete: (note: MemberNote) => void;
}) {
  return (
    <Dialog open={!!note} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex-row items-center justify-between gap-2 space-y-0 pr-8">
          <DialogTitle>Note — {note ? formatDate(note.date) : ""}</DialogTitle>
          {note && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(note)}>
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(note)}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </DialogHeader>
        {note && (
          <div className="space-y-5">
            {[
              { label: "HR Notes", value: note.hrNotes },
              { label: "Member Notes", value: note.memberNotes },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  {label}
                </p>
                <p className="text-sm whitespace-pre-wrap">{value || "—"}</p>
              </div>
            ))}
            {note.updatedAt !== note.createdAt && (
              <p className="text-xs text-muted-foreground">
                Last edited {formatDate(note.updatedAt)}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MemberNotes({ memberId }: { memberId: string }) {
  const [notes, setNotes] = useState<MemberNote[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<MemberNote | null>(null);
  const [previewNote, setPreviewNote] = useState<MemberNote | null>(null);
  const [deleteNote, setDeleteNote] = useState<MemberNote | null>(null);

  const loadNotes = useCallback(async () => {
    setNotes(await cmsApi<MemberNote[]>(`/api/team/${memberId}/notes`));
  }, [memberId]);

  useEffect(() => {
    loadNotes().catch(() => toast.error("Failed to load notes"));
  }, [loadNotes]);

  const openNew = () => {
    setEditingNote(null);
    setFormOpen(true);
  };

  const openEdit = (note: MemberNote) => {
    setPreviewNote(null);
    setEditingNote(note);
    setFormOpen(true);
  };

  const openDelete = (note: MemberNote) => {
    setPreviewNote(null);
    setDeleteNote(note);
  };

  const handleSubmit = async (values: NoteFormValues) => {
    try {
      if (editingNote) {
        await cmsApi(`/api/team/${memberId}/notes/${editingNote.id}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
        toast.success("Note updated");
      } else {
        await cmsApi(`/api/team/${memberId}/notes`, {
          method: "POST",
          body: JSON.stringify(values),
        });
        toast.success("Note added");
      }
    } catch (err) {
      toast.error((err as Error).message);
      return;
    }
    setFormOpen(false);
    setEditingNote(null);
    loadNotes();
  };

  const handleDelete = async () => {
    if (!deleteNote) return;
    try {
      await cmsApi(`/api/team/${memberId}/notes/${deleteNote.id}`, { method: "DELETE" });
      toast.success("Note deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setDeleteNote(null);
    loadNotes();
  };

  return (
    <div className="border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Notes
        </h2>
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" />
          New Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Date</TableHead>
              <TableHead>HR Notes</TableHead>
              <TableHead>Member Notes</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.map((note) => (
              <TableRow
                key={note.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setPreviewNote(note)}
              >
                <TableCell className="whitespace-nowrap align-top">{formatDate(note.date)}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs align-top">
                  <p className="line-clamp-2 whitespace-pre-wrap">{note.hrNotes || "—"}</p>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs align-top">
                  <p className="line-clamp-2 whitespace-pre-wrap">{note.memberNotes || "—"}</p>
                </TableCell>
                <TableCell className="align-top" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="Preview" onClick={() => setPreviewNote(note)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(note)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => openDelete(note)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <NoteFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingNote(null);
        }}
        note={editingNote}
        onSubmit={handleSubmit}
      />

      <NotePreviewDialog
        note={previewNote}
        onOpenChange={(open) => !open && setPreviewNote(null)}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <AlertDialog open={!!deleteNote} onOpenChange={(open) => !open && setDeleteNote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              The note from {deleteNote ? formatDate(deleteNote.date) : ""} will be permanently
              deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
