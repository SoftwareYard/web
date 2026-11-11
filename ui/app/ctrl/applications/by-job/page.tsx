"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { cmsApi } from "@/lib/cms-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, Building2, ChevronDown, ChevronRight, Loader2, MailX, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupApplication {
  id: string;
  fullName: string;
  email: string;
  salaryNetEur: number;
  jobTitle: string;
  onHold: boolean;
  rejectionSentAt: string | null;
  createdAt: string;
  role: { id: string; name: string } | null;
}

interface JobGroup {
  key: string;
  jobTitle: string;
  job: {
    id: string;
    title: string;
    isActive: boolean;
    postedDate: string;
    technology: { name: string } | null;
    client: { id: string; title: string } | null;
  } | null;
  applications: GroupApplication[];
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function ApplicationsByJobPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<JobGroup[] | null>(null);
  const [search, setSearch] = useState("");
  // Closed and unlinked groups start collapsed; toggled groups are remembered here
  const [toggled, setToggled] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<{ app: GroupApplication; position: string } | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setGroups(await cmsApi<JobGroup[]>("/api/applications/by-job"));
  }, []);

  useEffect(() => {
    load().catch(() => toast.error("Failed to load applications"));
  }, [load]);

  const visibleGroups = useMemo(() => {
    if (!groups) return [];
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        applications: g.applications.filter(
          (a) => a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.applications.length > 0);
  }, [groups, search]);

  const isOpen = (g: JobGroup) => {
    const openByDefault = g.job?.isActive ?? false;
    // While searching, show every group that has a match
    if (search.trim()) return true;
    return toggled.has(g.key) ? !openByDefault : openByDefault;
  };

  const toggle = (key: string) =>
    setToggled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const sendRejection = async () => {
    if (!confirming) return;
    const { app } = confirming;
    setConfirming(null);
    setSendingId(app.id);
    try {
      const { rejectionSentAt } = await cmsApi<{ rejectionSentAt: string }>(
        `/api/applications/${app.id}/reject`,
        { method: "POST" }
      );
      setGroups((prev) =>
        prev?.map((g) => ({
          ...g,
          applications: g.applications.map((a) => (a.id === app.id ? { ...a, rejectionSentAt } : a)),
        })) ?? prev
      );
      toast.success(`Rejection email sent to ${app.fullName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send the rejection email");
      // Another admin may have sent it already — refresh to show the real state
      load().catch(() => {});
    } finally {
      setSendingId(null);
    }
  };

  return (
    <CmsShell>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/ctrl/applications")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Applications by Job Post</h1>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {groups === null ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : visibleGroups.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No applications found</p>
      ) : (
        <div className="space-y-4">
          {visibleGroups.map((g) => {
            const open = isOpen(g);
            const position = g.job?.technology ? `${g.jobTitle} (${g.job.technology.name})` : g.jobTitle;
            const roles = [...new Set(g.applications.map((a) => a.role?.name).filter(Boolean))];
            const rejected = g.applications.filter((a) => a.rejectionSentAt).length;
            return (
              <Card key={g.key} className="gap-0 py-0 overflow-hidden">
                <CardHeader className="py-4">
                  <button
                    type="button"
                    onClick={() => toggle(g.key)}
                    className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 text-left"
                  >
                    {open ? (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    )}
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      {g.job?.client?.title ?? (g.job ? "No client" : "Job post not found")}
                    </span>
                    <CardTitle className="text-base">{position}</CardTitle>
                    {roles.map((r) => (
                      <Badge key={r} variant="secondary">
                        {r}
                      </Badge>
                    ))}
                    {g.job && !g.job.isActive && <Badge variant="outline">Closed</Badge>}
                    <span className="ml-auto text-sm text-muted-foreground">
                      {g.applications.length} application{g.applications.length !== 1 ? "s" : ""}
                      {rejected > 0 && ` · ${rejected} rejected`}
                    </span>
                  </button>
                </CardHeader>
                {open && (
                  <CardContent className="px-0 border-t">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Net Salary (EUR)</TableHead>
                          <TableHead>Applied On</TableHead>
                          <TableHead className="pr-6 text-right">Rejection</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {g.applications.map((app) => {
                          const sent = !!app.rejectionSentAt;
                          return (
                            <TableRow
                              key={app.id}
                              className={cn(
                                "cursor-pointer hover:bg-muted/50",
                                sent && "bg-muted/60 text-muted-foreground opacity-60"
                              )}
                              onClick={() => router.push(`/ctrl/applications/${app.id}`)}
                            >
                              <TableCell className="pl-6 font-medium">
                                {app.fullName}
                                {app.onHold && (
                                  <Badge variant="outline" className="ml-2 border-sky-500/60 text-sky-700 dark:text-sky-400">
                                    On hold
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{app.email}</TableCell>
                              <TableCell>{app.salaryNetEur.toLocaleString()}</TableCell>
                              <TableCell>{formatDate(app.createdAt)}</TableCell>
                              <TableCell className="pr-6 text-right">
                                {sent ? (
                                  <span className="text-xs">Sent {formatDate(app.rejectionSentAt!)}</span>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={sendingId === app.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirming({ app, position });
                                    }}
                                  >
                                    {sendingId === app.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <MailX className="w-4 h-4 mr-1.5" />
                                    )}
                                    Send rejection
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send rejection email?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirming &&
                `${confirming.app.fullName} (${confirming.app.email}) will get an email saying we won't move forward with their application for ${confirming.position}. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={sendRejection}>Send email</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CmsShell>
  );
}
