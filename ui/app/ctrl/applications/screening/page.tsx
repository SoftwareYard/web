"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { cmsApi } from "@/lib/cms-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ChevronLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CandidateRole {
  id: string;
  name: string;
}

interface Screening {
  id: string;
  criteria: string;
  role: CandidateRole | null;
  appliedFrom: string | null;
  status: "running" | "done" | "interrupted";
  total: number;
  processed: number;
  matches: number;
  createdAt: string;
}

const EXAMPLE_CRITERIA =
  "At least 3 years of professional experience as a software developer.\n.NET (C#) used in at least one job.";

export default function ScreeningPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<CandidateRole[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [criteria, setCriteria] = useState(EXAMPLE_CRITERIA);
  const [roleId, setRoleId] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [preview, setPreview] = useState<{
    count: number;
    max: number;
    aiProblem: string | null;
  } | null>(null);
  const [starting, setStarting] = useState(false);

  const loadScreenings = useCallback(async () => {
    setScreenings(await cmsApi<Screening[]>("/api/screenings"));
  }, []);

  useEffect(() => {
    cmsApi<CandidateRole[]>("/api/applications/roles").then(setRoles);
    loadScreenings();
  }, [loadScreenings]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (roleId) params.set("roleId", roleId);
    if (appliedFrom) params.set("appliedFrom", appliedFrom);
    cmsApi<{ count: number; max: number; aiProblem: string | null }>(`/api/screenings/preview?${params}`)
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [roleId, appliedFrom]);

  const start = async () => {
    setStarting(true);
    try {
      const screening = await cmsApi<Screening>("/api/screenings", {
        method: "POST",
        body: JSON.stringify({
          criteria,
          roleId: roleId || undefined,
          appliedFrom: appliedFrom || undefined,
        }),
      });
      router.push(`/ctrl/applications/screening/${screening.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start screening");
      setStarting(false);
    }
  };

  const tooMany = preview ? preview.count > preview.max : false;

  return (
    <CmsShell>
      <Button variant="ghost" className="mb-4 -ml-3" onClick={() => router.push("/ctrl/applications")}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        Job Applications
      </Button>

      <h1 className="text-2xl font-bold mb-2">AI CV Screening</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Describe what a suitable candidate looks like. Each CV is read and marked as a match, no
        match, or unclear, with a short reason. Applications on hold are skipped. Always open the CV before rejecting someone.
      </p>

      {preview?.aiProblem && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm max-w-2xl">
          <p className="font-medium text-destructive">The last AI run stopped: {preview.aiProblem}</p>
          <p className="text-muted-foreground mt-1">
            Fix it at{" "}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="underline">
              console.anthropic.com
            </a>{" "}
            (Billing) before starting a new screening.
          </p>
        </div>
      )}

      <div className="border rounded-lg p-4 space-y-4 max-w-2xl mb-10">
        <div className="space-y-2">
          <Label htmlFor="criteria">Criteria</Label>
          <Textarea
            id="criteria"
            rows={5}
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            placeholder="e.g. At least 3 years of experience, .NET in the stack"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={roleId || "all"} onValueChange={(v) => setRoleId(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="appliedFrom">Applied on or after</Label>
            <Input
              id="appliedFrom"
              type="date"
              className="w-[200px]"
              value={appliedFrom}
              onChange={(e) => setAppliedFrom(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className={`text-sm ${tooMany ? "text-destructive" : "text-muted-foreground"}`}>
            {preview &&
              (tooMany
                ? `${preview.count} applications match; narrow the filters to ${preview.max} or fewer.`
                : `${preview.count} application${preview.count === 1 ? "" : "s"} will be screened.`)}
          </span>
          <Button
            onClick={start}
            disabled={starting || !criteria.trim() || !preview?.count || tooMany}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {starting ? "Starting..." : "Start screening"}
          </Button>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Previous screenings</h2>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Criteria</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Matches</TableHead>
              <TableHead>Run on</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {screenings.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/ctrl/applications/screening/${s.id}`)}
              >
                <TableCell className="max-w-md truncate">{s.criteria.replace(/\s+/g, " ")}</TableCell>
                <TableCell>{s.role?.name ?? "All"}</TableCell>
                <TableCell>
                  {s.status === "running" ? (
                    <Badge variant="secondary">
                      {s.processed}/{s.total}
                    </Badge>
                  ) : s.status === "interrupted" ? (
                    <Badge variant="destructive">Interrupted</Badge>
                  ) : (
                    <Badge variant="outline">Done</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {s.matches} / {s.total}
                </TableCell>
                <TableCell>
                  {new Date(s.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
            {screenings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No screenings yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </CmsShell>
  );
}
