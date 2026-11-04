"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { cmsApi } from "@/lib/cms-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Verdict = "match" | "no_match" | "unclear" | "error";

interface ScreeningResult {
  id: string;
  verdict: Verdict;
  yearsExperience: number | null;
  skills: string[];
  reason: string;
  application: {
    id: string;
    fullName: string;
    email: string;
    jobTitle: string;
    cvLink: string;
    salaryNetEur: number;
    createdAt: string;
  };
}

interface Screening {
  id: string;
  criteria: string;
  role: { id: string; name: string } | null;
  appliedFrom: string | null;
  status: "running" | "done" | "interrupted";
  stopReason: string | null;
  total: number;
  processed: number;
  createdAt: string;
  results: ScreeningResult[];
}

const VERDICTS: { value: Verdict; label: string }[] = [
  { value: "match", label: "Matches" },
  { value: "unclear", label: "Unclear" },
  { value: "no_match", label: "No match" },
  { value: "error", label: "Errors" },
];

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  switch (verdict) {
    case "match":
      return <Badge>Match</Badge>;
    case "no_match":
      return <Badge variant="outline">No match</Badge>;
    case "unclear":
      return <Badge variant="secondary">Unclear</Badge>;
    default:
      return <Badge variant="destructive">Error</Badge>;
  }
}

export default function ScreeningResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [screening, setScreening] = useState<Screening | null>(null);
  const [filter, setFilter] = useState<Verdict>("match");

  const load = useCallback(async () => {
    setScreening(await cmsApi<Screening>(`/api/screenings/${id}`));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while the run is in progress
  useEffect(() => {
    if (screening?.status !== "running") return;
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [screening?.status, load]);

  const remove = async () => {
    if (!confirm("Delete this screening and its results?")) return;
    try {
      await cmsApi(`/api/screenings/${id}`, { method: "DELETE" });
      router.push("/ctrl/applications/screening");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (!screening) {
    return (
      <CmsShell>
        <p className="text-muted-foreground">Loading...</p>
      </CmsShell>
    );
  }

  const counts = Object.fromEntries(
    VERDICTS.map(({ value }) => [value, screening.results.filter((r) => r.verdict === value).length])
  ) as Record<Verdict, number>;
  const rows = screening.results.filter((r) => r.verdict === filter);
  const percent = screening.total ? Math.round((screening.processed / screening.total) * 100) : 0;

  return (
    <CmsShell>
      <Button variant="ghost" className="mb-4 -ml-3" onClick={() => router.push("/ctrl/applications/screening")}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        AI CV Screening
      </Button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Screening results</h1>
          <p className="text-sm whitespace-pre-line max-w-2xl">{screening.criteria}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {screening.role?.name ?? "All roles"}
            {screening.appliedFrom &&
              ` · applied from ${new Date(screening.appliedFrom).toLocaleDateString("en-GB")}`}
            {` · run ${new Date(screening.createdAt).toLocaleString("en-GB")}`}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={remove} aria-label="Delete screening">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {screening.status !== "done" && (
        <div className="mb-6 max-w-2xl">
          <div className="flex justify-between text-sm mb-1">
            <span>
              {screening.status === "running"
                ? "Reading CVs..."
                : `This run stopped early: ${screening.stopReason ?? "unknown reason"}. Results so far are below.`}
            </span>
            <span className="text-muted-foreground">
              {screening.processed} / {screening.total}
            </span>
          </div>
          <Progress value={percent} />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {VERDICTS.map(({ value, label }) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {label} ({counts[value]})
          </Button>
        ))}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Verdict</TableHead>
              <TableHead>Years</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>CV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer hover:bg-muted/50 align-top"
                onClick={() => router.push(`/ctrl/applications/${r.application.id}`)}
              >
                <TableCell>
                  <div className="font-medium">{r.application.fullName}</div>
                  <div className="text-xs text-muted-foreground">{r.application.jobTitle}</div>
                </TableCell>
                <TableCell>
                  <VerdictBadge verdict={r.verdict} />
                </TableCell>
                <TableCell>{r.yearsExperience ?? "—"}</TableCell>
                <TableCell className="max-w-xs">
                  <div className="flex flex-wrap gap-1">
                    {r.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="font-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-md whitespace-normal text-sm">{r.reason}</TableCell>
                <TableCell>
                  {r.application.cvLink && (
                    <a
                      href={r.application.cvLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-sm underline"
                    >
                      Open <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {screening.status === "running" ? "Nothing here yet" : "No candidates in this group"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </CmsShell>
  );
}
