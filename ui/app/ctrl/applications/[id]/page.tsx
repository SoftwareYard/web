"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { cmsApi } from "@/lib/cms-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Ban, ChevronLeft, ExternalLink, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CandidateRole {
  id: string;
  name: string;
}

interface BlockedApplicant {
  id: string;
  email: string;
  reason: string | null;
  createdAt: string;
}

interface JobApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  roleId: string | null;
  role: CandidateRole | null;
  salaryNetEur: number;
  salaryGrossEur: number;
  salaryNetMkd: number;
  salaryGrossMkd: number;
  cvLink: string;
  taskLink: string | null;
  hrInterviewTime: string | null;
  firstInterviewTime: string | null;
  secondInterviewTime: string | null;
  hrNotes: string | null;
  techNotes: string | null;
  onHold: boolean;
  holdReason: string | null;
  heldAt: string | null;
  createdAt: string;
  blocked: BlockedApplicant | null;
  otherApplications: { id: string; jobTitle: string; createdAt: string }[];
  profile: {
    status: "done" | "error";
    error: string | null;
    primarySkills: string[];
    allSkills: string[];
    yearsExperience: number | null;
    about: string | null;
    summary: string | null;
    scannedAt: string;
  } | null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [app, setApp] = useState<JobApplication | null>(null);
  const [hrNotes, setHrNotes] = useState("");
  const [techNotes, setTechNotes] = useState("");
  const [hrInterviewTime, setHrInterviewTime] = useState("");
  const [firstInterviewTime, setFirstInterviewTime] = useState("");
  const [secondInterviewTime, setSecondInterviewTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingInterviews, setSavingInterviews] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdReason, setHoldReason] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [roles, setRoles] = useState<CandidateRole[]>([]);
  const [edit, setEdit] = useState({
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    roleId: "",
    salaryNetEur: "",
  });

  const toDatetimeLocal = (iso: string | null) => {
    if (!iso) return "";
    return new Date(iso).toISOString().slice(0, 16);
  };

  useEffect(() => {
    cmsApi<JobApplication>(`/api/applications/${id}`).then((data) => {
      setApp(data);
      setHrNotes(data.hrNotes ?? "");
      setTechNotes(data.techNotes ?? "");
      setHrInterviewTime(toDatetimeLocal(data.hrInterviewTime));
      setFirstInterviewTime(toDatetimeLocal(data.firstInterviewTime));
      setSecondInterviewTime(toDatetimeLocal(data.secondInterviewTime));
    });
  }, [id]);

  const handleSaveInterviews = async () => {
    setSavingInterviews(true);
    try {
      await cmsApi(`/api/applications/${id}/interviews`, {
        method: "PATCH",
        body: JSON.stringify({
          hrInterviewTime: hrInterviewTime || null,
          firstInterviewTime: firstInterviewTime || null,
          secondInterviewTime: secondInterviewTime || null,
        }),
      });
      toast.success("Interviews saved");
    } catch {
      toast.error("Failed to save interviews");
    } finally {
      setSavingInterviews(false);
    }
  };

  const openEdit = () => {
    if (!app) return;
    setEdit({
      fullName: app.fullName,
      email: app.email,
      phone: app.phone,
      jobTitle: app.jobTitle,
      roleId: app.roleId ?? "",
      salaryNetEur: String(app.salaryNetEur),
    });
    if (roles.length === 0) {
      cmsApi<CandidateRole[]>("/api/applications/roles").then(setRoles).catch(() => {});
    }
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const updated = await cmsApi<JobApplication>(`/api/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...edit,
          roleId: edit.roleId || null,
          salaryNetEur: Number(edit.salaryNetEur),
        }),
      });
      setApp((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditOpen(false);
      toast.success("Application updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update application");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleHold = async (onHold: boolean) => {
    try {
      const hold = await cmsApi<Pick<JobApplication, "onHold" | "holdReason" | "heldAt">>(
        `/api/applications/${id}/hold`,
        { method: "PATCH", body: JSON.stringify({ onHold, reason: holdReason }) }
      );
      setApp((prev) => (prev ? { ...prev, ...hold } : prev));
      setHoldReason("");
      toast.success(onHold ? "Put on hold" : "Released from hold");
    } catch {
      toast.error("Failed to update hold");
    }
  };

  const handleDelete = async () => {
    try {
      await cmsApi(`/api/applications/${id}`, { method: "DELETE" });
      toast.success("Application deleted");
      router.push("/ctrl/applications");
    } catch {
      toast.error("Failed to delete application");
    }
  };

  const handleBlock = async () => {
    try {
      const blocked = await cmsApi<BlockedApplicant>(`/api/applications/${id}/block`, {
        method: "POST",
        body: JSON.stringify({ reason: blockReason }),
      });
      setApp((prev) => (prev ? { ...prev, blocked } : prev));
      setBlockReason("");
      toast.success(`${blocked.email} blocked`);
    } catch {
      toast.error("Failed to block applicant");
    }
  };

  const handleUnblock = async () => {
    if (!app?.blocked) return;
    try {
      await cmsApi(`/api/applications/blocked/${app.blocked.id}`, { method: "DELETE" });
      setApp((prev) => (prev ? { ...prev, blocked: null } : prev));
      toast.success("Applicant unblocked");
    } catch {
      toast.error("Failed to unblock applicant");
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await cmsApi(`/api/applications/${id}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ hrNotes, techNotes }),
      });
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!app) {
    return (
      <CmsShell>
        <div className="text-muted-foreground text-sm">Loading...</div>
      </CmsShell>
    );
  }

  return (
    <CmsShell>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="-ml-2 mb-4" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{app.fullName}</h1>
            <p className="text-muted-foreground text-sm mt-1">{app.jobTitle}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {app.role && <Badge variant="secondary">{app.role.name}</Badge>}
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil className="w-3.5 h-3.5 mr-2" />
              Edit
            </Button>
            {app.onHold ? (
              <Button variant="outline" size="sm" onClick={() => handleHold(false)}>
                <Play className="w-3.5 h-3.5 mr-2" />
                Release hold
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setHoldOpen(true)}>
                <Pause className="w-3.5 h-3.5 mr-2" />
                Put on hold
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete
            </Button>
            {app.blocked ? (
              <Button variant="outline" size="sm" onClick={handleUnblock}>
                Unblock
              </Button>
            ) : (
              <Button variant="destructive" size="sm" onClick={() => setBlockOpen(true)}>
                <Ban className="w-3.5 h-3.5 mr-2" />
                Block
              </Button>
            )}
          </div>
        </div>
        {app.onHold && (
          <div className="mt-4 rounded-lg border border-sky-500/50 bg-sky-500/5 p-3 text-sm">
            <span className="font-medium text-sky-700 dark:text-sky-400">On hold</span>
            {app.heldAt && ` since ${formatDate(app.heldAt)}`} — skipped by AI scans and screenings.
            {app.holdReason && <p className="mt-1 text-muted-foreground">Reason: {app.holdReason}</p>}
          </div>
        )}
        {app.otherApplications.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-500/50 bg-amber-500/5 p-3 text-sm">
            <span className="font-medium text-amber-700 dark:text-amber-400">
              Applied {app.otherApplications.length + 1} times
            </span>{" "}
            with {app.email}. Other applications:
            <ul className="mt-1 space-y-0.5">
              {app.otherApplications.map((other) => (
                <li key={other.id}>
                  <button
                    type="button"
                    className="underline hover:text-foreground"
                    onClick={() => router.push(`/ctrl/applications/${other.id}`)}
                  >
                    {other.jobTitle}
                  </button>
                  <span className="text-muted-foreground"> · {formatDate(other.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {app.blocked && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
            <span className="font-medium text-destructive">Blocked</span> since {formatDate(app.blocked.createdAt)} —
            new applications from {app.blocked.email} are ignored.
            {app.blocked.reason && <p className="mt-1 text-muted-foreground">Reason: {app.blocked.reason}</p>}
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* Contact */}
        <div className="border rounded-lg p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Contact</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Email">{app.email}</Field>
            <Field label="Phone">{app.phone}</Field>
            <Field label="Applied">{formatDate(app.createdAt)}</Field>
          </div>
        </div>

        {/* AI profile */}
        {app.profile && (
          <div className="border rounded-lg p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              AI Profile
            </h2>
            {app.profile.status === "error" ? (
              <p className="text-sm text-muted-foreground">
                The last scan failed: {app.profile.error}. It will be retried on the next scan.
              </p>
            ) : (
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Years of experience">{app.profile.yearsExperience ?? "—"}</Field>
                  <Field label="Primary skills">{app.profile.primarySkills.join(", ") || "—"}</Field>
                  <Field label="Scanned">{formatDate(app.profile.scannedAt)}</Field>
                </div>
                <Field label="About">{app.profile.about}</Field>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Summary</p>
                  <p className="text-sm">{app.profile.summary}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">All skills</p>
                  <div className="flex flex-wrap gap-1">
                    {app.profile.allSkills.map((s) => (
                      <Badge key={s} variant="outline" className="font-normal">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Salary */}
        <div className="border rounded-lg p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Salary</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Net (EUR)">{app.salaryNetEur.toLocaleString()} €</Field>
            <Field label="Gross (EUR)">{app.salaryGrossEur.toLocaleString()} €</Field>
            <Field label="Net (MKD)">{app.salaryNetMkd.toLocaleString()} ден</Field>
            <Field label="Gross (MKD)">{app.salaryGrossMkd.toLocaleString()} ден</Field>
          </div>
        </div>

        {/* Documents */}
        <div className="border rounded-lg p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Documents</h2>
          <div className="flex gap-3">
            {app.cvLink && (
              <a href={app.cvLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  View CV
                </Button>
              </a>
            )}
            {app.taskLink && (
              <a href={app.taskLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  View Task
                </Button>
              </a>
            )}
            {!app.cvLink && !app.taskLink && (
              <span className="text-sm text-muted-foreground">No documents</span>
            )}
          </div>
        </div>

        {/* Interviews */}
        <div className="border rounded-lg p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Interviews</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">HR Interview</label>
              <Input
                type="datetime-local"
                value={hrInterviewTime}
                onChange={(e) => setHrInterviewTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">1st Interview</label>
              <Input
                type="datetime-local"
                value={firstInterviewTime}
                onChange={(e) => setFirstInterviewTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">2nd Interview</label>
              <Input
                type="datetime-local"
                value={secondInterviewTime}
                onChange={(e) => setSecondInterviewTime(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveInterviews} disabled={savingInterviews}>
              {savingInterviews ? "Saving..." : "Save Interviews"}
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div className="border rounded-lg p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Comments</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">HR Notes</label>
              <Textarea
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                rows={5}
                className="resize-none"
                placeholder="Add HR notes..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Tech Notes</label>
              <Textarea
                value={techNotes}
                onChange={(e) => setTechNotes(e.target.value)}
                rows={5}
                className="resize-none"
                placeholder="Add tech notes..."
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveNotes} disabled={saving}>
              {saving ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {app.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              New applications from {app.email} will be ignored. You can unblock them later from the blocked list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            rows={3}
            className="resize-none"
            placeholder="Reason (optional)"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock}>Block</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={holdOpen} onOpenChange={setHoldOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Put {app.fullName} on hold?</AlertDialogTitle>
            <AlertDialogDescription>
              The application stays, but AI scans and screenings skip it until you release the hold.
              This is not a block: they can still apply.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={holdReason}
            onChange={(e) => setHoldReason(e.target.value)}
            rows={3}
            className="resize-none"
            placeholder="Reason (optional), e.g. salary expectation too high for this role"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleHold(true)}>Put on hold</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this application?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {app.fullName}&apos;s application for {app.jobTitle}, its CV file,
              notes and AI results. It can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit application</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {(
              [
                ["fullName", "Full name", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone", "tel"],
                ["jobTitle", "Job title", "text"],
                ["salaryNetEur", "Expected net salary (EUR)", "number"],
              ] as const
            ).map(([key, label, type]) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={`edit-${key}`}>{label}</Label>
                <Input
                  id={`edit-${key}`}
                  type={type}
                  min={type === "number" ? 1 : undefined}
                  value={edit[key]}
                  onChange={(e) => setEdit((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <Select
                value={edit.roleId || "none"}
                onValueChange={(v) => setEdit((prev) => ({ ...prev, roleId: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No role</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Gross and MKD salaries are recalculated from the net EUR amount.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CmsShell>
  );
}
