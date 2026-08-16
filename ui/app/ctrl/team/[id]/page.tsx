"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { MeetingForm, MeetingFormValues } from "@/components/ctrl/meeting-form";
import { PortalAccessDialog } from "@/components/ctrl/portal-access-dialog";
import { cmsApi } from "@/lib/cms-api";
import { Meeting, MEETING_FIELDS } from "@/lib/meeting";
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
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ChevronLeft, Loader2, Pencil, Plus, Upload, X } from "lucide-react";
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
  currentSalaryGross: number | null;
  contractInMonths: number | null;
  lastContractDate: string | null;
  nextContractDate: string | null;
  sortOrder: number;
  hasPortalAccess: boolean;
}

interface CandidateRole {
  id: string;
  name: string;
}

const teamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  bio: z.string().default(""),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  hireDate: z.string().optional(),
  currentSalaryEur: z.string().optional(),
  currentSalaryGross: z.string().optional(),
  contractInMonths: z.string().optional(),
  lastContractDate: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
});

type FormValues = z.infer<typeof teamSchema>;

function toDateInputValue(val: unknown): string {
  if (!val) return "";
  const d = new Date(val as string);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function formatDate(val: string | null) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function meetingToFormValues(m: Meeting): MeetingFormValues {
  return {
    date: toDateInputValue(m.date),
    feelingAtWork: m.feelingAtWork ?? "",
    currentWorkload: m.currentWorkload ?? "",
    thingsOutsideWork: m.thingsOutsideWork ?? "",
    problemsWithClient: m.problemsWithClient ?? "",
    problemsWithTeam: m.problemsWithTeam ?? "",
    skillsToDevelop: m.skillsToDevelop ?? "",
    growingInRole: m.growingInRole ?? "",
    trainingOpportunities: m.trainingOpportunities ?? "",
    anythingElse: m.anythingElse ?? "",
    improvementSuggestions: m.improvementSuggestions ?? "",
  };
}

function MeetingDetailDialog({
  meeting,
  onOpenChange,
  onEdit,
}: {
  meeting: Meeting | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (meeting: Meeting) => void;
}) {
  return (
    <Dialog open={!!meeting} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex-row items-center justify-between gap-2 space-y-0 pr-8">
          <DialogTitle>1-on-1 Meeting — {meeting ? formatDate(meeting.date) : ""}</DialogTitle>
          {meeting && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(meeting)}>
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </DialogHeader>
        {meeting && (
          <div className="space-y-4">
            {MEETING_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  {label}
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {(meeting[key] as string | null) || "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PreviewCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 bg-muted">
        {member.image ? (
          <Image src={member.image} alt={member.name} fill className="object-cover object-top" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-muted-foreground/30">
              {member.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold">{member.name}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">{member.role}</p>
        {member.bio && (
          <p className="text-sm mt-3 text-pretty leading-relaxed">{member.bio}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {member.email && <span>{member.email}</span>}
          {member.phone && <span>{member.phone}</span>}
          {member.hireDate && <span>Hired {formatDate(member.hireDate)}</span>}
          {member.currentSalaryEur && (
            <span>{member.currentSalaryEur.toLocaleString()} EUR net</span>
          )}
          {member.currentSalaryGross && (
            <span>{member.currentSalaryGross.toLocaleString()} EUR gross</span>
          )}
          {member.nextContractDate && (
            <span>Next contract {formatDate(member.nextContractDate)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [member, setMember] = useState<TeamMember | null>(null);
  const [roles, setRoles] = useState<CandidateRole[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [portalAccessDialogOpen, setPortalAccessDialogOpen] = useState(false);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      role: "",
      bio: "",
      email: "",
      phone: "",
      hireDate: "",
      currentSalaryEur: "",
      currentSalaryGross: "",
      contractInMonths: "",
      lastContractDate: "",
      sortOrder: 0,
    },
  });

  const loadData = useCallback(async () => {
    const [m, r, mtgs] = await Promise.all([
      cmsApi<TeamMember>(`/api/team/${id}`),
      cmsApi<CandidateRole[]>("/api/team/roles"),
      cmsApi<Meeting[]>(`/api/team/${id}/meetings`),
    ]);
    setMember(m);
    setRoles(r);
    setMeetings(mtgs);
    form.reset({
      name: m.name,
      role: m.role,
      bio: m.bio,
      email: m.email ?? "",
      phone: m.phone ?? "",
      hireDate: toDateInputValue(m.hireDate),
      currentSalaryEur: m.currentSalaryEur != null ? String(m.currentSalaryEur) : "",
      currentSalaryGross: m.currentSalaryGross != null ? String(m.currentSalaryGross) : "",
      contractInMonths: m.contractInMonths != null ? String(m.contractInMonths) : "",
      lastContractDate: toDateInputValue(m.lastContractDate),
      sortOrder: m.sortOrder,
    });
  }, [id, form]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (values: FormValues) => {
    const fd = new FormData();
    fd.append("name", values.name);
    fd.append("role", values.role);
    fd.append("bio", values.bio || "");
    fd.append("email", values.email || "");
    fd.append("phone", values.phone || "");
    fd.append("hireDate", values.hireDate || "");
    fd.append("currentSalaryEur", values.currentSalaryEur || "");
    fd.append("currentSalaryGross", values.currentSalaryGross || "");
    fd.append("contractInMonths", values.contractInMonths || "");
    fd.append("lastContractDate", values.lastContractDate || "");
    fd.append("sortOrder", String(values.sortOrder));
    if (imageFile) fd.append("image", imageFile);

    const res = await fetch(`${API_URL}/api/team/${id}`, {
      method: "PUT",
      credentials: "include",
      body: fd,
    });
    if (!res.ok) {
      toast.error("Failed to save changes");
      return;
    }
    toast.success("Saved");
    setImageFile(null);
    setFileName("");
    loadData();
  };

  const handleSubmitMeeting = async (values: MeetingFormValues) => {
    if (editingMeeting) {
      await cmsApi(`/api/team/${id}/meetings/${editingMeeting.id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });
      toast.success("Meeting updated");
    } else {
      await cmsApi(`/api/team/${id}/meetings`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Meeting created");
    }
    setMeetingFormOpen(false);
    setEditingMeeting(null);
    loadData();
  };

  const handleSetPortalPassword = async (password: string) => {
    await cmsApi(`/api/team/${id}/portal-access`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    });
    toast.success(member?.hasPortalAccess ? "Password reset" : "Portal access enabled");
    setPortalAccessDialogOpen(false);
    loadData();
  };

  const handleRevokePortalAccess = async () => {
    await cmsApi(`/api/team/${id}/portal-access`, { method: "DELETE" });
    toast.success("Portal access revoked");
    setRevokeConfirmOpen(false);
    loadData();
  };

  const openNewMeeting = () => {
    setEditingMeeting(null);
    setMeetingFormOpen(true);
  };

  const openEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(null);
    setEditingMeeting(meeting);
    setMeetingFormOpen(true);
  };

  if (!member) {
    return (
      <CmsShell>
        <div className="text-muted-foreground text-sm">Loading...</div>
      </CmsShell>
    );
  }

  const watchedLast = form.watch("lastContractDate");
  const watchedMonths = parseInt(form.watch("contractInMonths") || "");
  const computedNext = (() => {
    if (!watchedLast || isNaN(watchedMonths)) return "";
    const d = new Date(watchedLast);
    d.setMonth(d.getMonth() + watchedMonths);
    return d.toISOString().split("T")[0];
  })();

  return (
    <CmsShell>
      <Button variant="ghost" size="sm" className="-ml-2 mb-6" onClick={() => router.back()}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      <div className="grid grid-cols-1 gap-6">
        {/* Preview */}
        <div className="border rounded-lg p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            Preview
          </h2>
          <PreviewCard member={member} />
        </div>

        {/* Time Off Portal Access */}
        <div className="border rounded-lg p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            Time Off Portal Access
          </h2>
          {member.hasPortalAccess ? (
            <div className="flex items-center justify-between">
              <div>
                <Badge className="mb-1">Enabled</Badge>
                <p className="text-sm text-muted-foreground">
                  Can log in at /portal/login using {member.email}.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPortalAccessDialogOpen(true)}>
                  Reset Password
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setRevokeConfirmOpen(true)}>
                  Revoke Access
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                This team member cannot log in to the time off portal yet.
                {!member.email && " Add an email first."}
              </p>
              <Button
                size="sm"
                disabled={!member.email}
                onClick={() => setPortalAccessDialogOpen(true)}
              >
                Enable Portal Access
              </Button>
            </div>
          )}
        </div>

        {/* Edit */}
        <div className="border rounded-lg p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            Edit
          </h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.name}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea rows={3} className="resize-none" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Photo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Photo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setFileName(file.name);
                    }
                  }}
                />
                {fileName ? (
                  <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                    <span className="text-sm truncate flex-1">{fileName}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setImageFile(null);
                        setFileName("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="hireDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hire Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentSalaryEur"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Net (EUR)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentSalaryGross"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Gross (EUR)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractInMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract (months)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="12" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="lastContractDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Contract Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Next Contract Date</label>
                  <Input
                    type="date"
                    readOnly
                    value={computedNext}
                    className="bg-muted text-muted-foreground"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* 1-on-1 Meetings */}
        <div className="border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              1-on-1 Meetings
            </h2>
            <Button size="sm" onClick={openNewMeeting}>
              <Plus className="w-4 h-4 mr-1" />
              New Meeting
            </Button>
          </div>
          {meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meetings recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Feeling at Work</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead>Skills to Develop</TableHead>
                  <TableHead>Growing in Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((m) => (
                  <TableRow
                    key={m.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedMeeting(m)}
                  >
                    <TableCell className="whitespace-nowrap">{formatDate(m.date)}</TableCell>
                    <TableCell className="text-muted-foreground">{m.feelingAtWork || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.currentWorkload || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.skillsToDevelop || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.growingInRole || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <MeetingForm
        open={meetingFormOpen}
        onOpenChange={(open) => {
          setMeetingFormOpen(open);
          if (!open) setEditingMeeting(null);
        }}
        onSubmit={handleSubmitMeeting}
        initialValues={editingMeeting ? meetingToFormValues(editingMeeting) : undefined}
      />
      <MeetingDetailDialog
        meeting={selectedMeeting}
        onOpenChange={(open) => !open && setSelectedMeeting(null)}
        onEdit={openEditMeeting}
      />

      <PortalAccessDialog
        open={portalAccessDialogOpen}
        onOpenChange={setPortalAccessDialogOpen}
        title={member.hasPortalAccess ? "Reset Portal Password" : "Enable Portal Access"}
        onSubmit={handleSetPortalPassword}
      />

      <AlertDialog open={revokeConfirmOpen} onOpenChange={setRevokeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke portal access?</AlertDialogTitle>
            <AlertDialogDescription>
              {member.name} will no longer be able to log in to the time off portal. Their time off history is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokePortalAccess}>Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CmsShell>
  );
}
