"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { cmsApi } from "@/lib/cms-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface CandidateRole {
  id: string;
  name: string;
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
  createdAt: string;
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
          {app.role && <Badge variant="secondary">{app.role.name}</Badge>}
        </div>
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
    </CmsShell>
  );
}
