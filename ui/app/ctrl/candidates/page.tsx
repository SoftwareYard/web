"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CmsShell } from "@/components/ctrl/cms-shell";
import { cmsApi } from "@/lib/cms-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ScanSearch,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface CandidateRole {
  id: string;
  name: string;
}

interface Candidate {
  applicationId: string;
  fullName: string;
  email: string;
  jobTitle: string;
  roleName: string | null;
  salaryNetEur: number;
  appliedAt: string;
  onHold: boolean;
  holdReason: string | null;
  applicationCount: number;
  primarySkills: string[];
  allSkills: string[];
  yearsExperience: number | null;
  about: string | null;
  summary: string | null;
  scannedAt: string;
}

interface ScanStatus {
  running: boolean;
  total: number;
  processed: number;
  failed: number;
  pending: number | null;
  failedTotal: number;
  onHold: number;
  stopReason: string | null;
  aiProblem: string | null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const SORTS = ["scanned", "applied", "experience", "salary"];

export default function CandidatesPage() {
  return (
    <Suspense>
      <CandidatesList />
    </Suspense>
  );
}

function CandidatesList() {
  const router = useRouter();
  const pathname = usePathname();
  // Paging and filters live in the URL, so Back from an application returns to the same view
  const searchParams = useSearchParams();
  const param = (key: string) => searchParams.get(key) ?? "";

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [roles, setRoles] = useState<CandidateRole[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get("page")) || 1));
  const [scan, setScan] = useState<ScanStatus | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [search, setSearch] = useState(() => param("search"));
  const [skills, setSkills] = useState(() => param("skills"));
  const [minYears, setMinYears] = useState(() => param("minYears"));
  const [maxSalary, setMaxSalary] = useState(() => param("maxSalary"));
  const [roleId, setRoleId] = useState(() => param("role"));
  const [sort, setSort] = useState(() => (SORTS.includes(param("sort")) ? param("sort") : "scanned"));
  const [includeOnHold, setIncludeOnHold] = useState(() => searchParams.get("onHold") === "1");

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (search) params.set("search", search);
    if (skills) params.set("skills", skills);
    if (minYears) params.set("minYears", minYears);
    if (maxSalary) params.set("maxSalary", maxSalary);
    if (roleId) params.set("role", roleId);
    if (sort !== "scanned") params.set("sort", sort);
    if (includeOnHold) params.set("onHold", "1");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [router, pathname, page, search, skills, minYears, maxSalary, roleId, sort, includeOnHold]);

  const loadCandidates = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "25", sort });
    if (search) params.set("search", search);
    if (skills) params.set("skills", skills);
    if (minYears) params.set("minYears", minYears);
    if (maxSalary) params.set("maxSalary", maxSalary);
    if (roleId) params.set("roleId", roleId);
    if (includeOnHold) params.set("includeOnHold", "1");
    const res = await cmsApi<{ data: Candidate[]; total: number; totalPages: number }>(
      `/api/candidates?${params}`
    );
    setCandidates(res.data);
    setTotal(res.total);
    setTotalPages(res.totalPages);
  }, [page, sort, search, skills, minYears, maxSalary, roleId, includeOnHold]);

  const loadScan = useCallback(async () => {
    setScan(await cmsApi<ScanStatus>("/api/candidates/scan"));
  }, []);

  useEffect(() => {
    cmsApi<CandidateRole[]>("/api/applications/roles").then(setRoles);
    loadScan();
  }, [loadScan]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  // While scanning, refresh progress and the list as profiles come in
  useEffect(() => {
    if (!scan?.running) return;
    const timer = setInterval(() => {
      loadScan();
      loadCandidates();
    }, 3000);
    return () => clearInterval(timer);
  }, [scan?.running, loadScan, loadCandidates]);

  const startScan = async () => {
    try {
      await cmsApi("/api/candidates/scan", { method: "POST" });
      await loadScan();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start scan");
    }
  };

  // Any filter change goes back to the first page
  const onFilter = (set: (v: string) => void) => (value: string) => {
    set(value);
    setPage(1);
  };

  const percent = scan?.total ? Math.round((scan.processed / scan.total) * 100) : 0;

  return (
    <CmsShell>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Profiles the AI read from each CV. Every CV is scanned once; searching here is free and instant.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button onClick={startScan} disabled={!scan || scan.running || scan.pending === 0}>
            <ScanSearch className="w-4 h-4 mr-2" />
            {scan?.running
              ? "Scanning..."
              : scan?.pending
                ? `Scan ${scan.pending} new CV${scan.pending === 1 ? "" : "s"}`
                : "All CVs scanned"}
          </Button>
          {!scan?.running && !!scan?.failedTotal && (
            <span className="text-xs text-muted-foreground">
              Includes {scan.failedTotal} that failed before and will be retried
            </span>
          )}
          {!!scan?.onHold && (
            <span className="text-xs text-muted-foreground">
              {scan.onHold} on hold, not scanned
            </span>
          )}
        </div>
      </div>

      {!scan?.running && (scan?.aiProblem || scan?.stopReason) && (
        <div className="mb-6 flex gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm max-w-3xl">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="font-medium text-destructive">
              Scanning stopped: {scan.aiProblem ?? scan.stopReason}
            </p>
            <p className="text-muted-foreground mt-1">
              CVs that weren&apos;t read are still waiting and nothing was marked as failed. Fix it at{" "}
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="underline">
                console.anthropic.com
              </a>{" "}
              (Billing), then click Scan again.
            </p>
          </div>
        </div>
      )}

      {scan?.running && (
        <div className="mb-6 max-w-2xl">
          <div className="flex justify-between text-sm mb-1">
            <span>Reading CVs...</span>
            <span className="text-muted-foreground">
              {scan.processed} / {scan.total}
              {scan.failed > 0 && ` · ${scan.failed} failed`}
            </span>
          </div>
          <Progress value={percent} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, summary, skills..."
            value={search}
            onChange={(e) => onFilter(setSearch)(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          placeholder="Skills, e.g. .NET, React"
          value={skills}
          onChange={(e) => onFilter(setSkills)(e.target.value)}
          className="w-full sm:w-52"
        />
        <Input
          type="number"
          min="0"
          placeholder="Min. years"
          value={minYears}
          onChange={(e) => onFilter(setMinYears)(e.target.value)}
          className="w-28"
        />
        <Input
          type="number"
          min="0"
          placeholder="Max. salary €"
          value={maxSalary}
          onChange={(e) => onFilter(setMaxSalary)(e.target.value)}
          className="w-32"
        />
        <Select value={roleId || "all"} onValueChange={(v) => onFilter(setRoleId)(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
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
        <div className="flex items-center gap-2">
          <Checkbox
            id="includeOnHold"
            checked={includeOnHold}
            onCheckedChange={(v) => {
              setIncludeOnHold(v === true);
              setPage(1);
            }}
          />
          <Label htmlFor="includeOnHold" className="text-sm font-normal">
            Show on hold
          </Label>
        </div>
        <Select value={sort} onValueChange={onFilter(setSort)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scanned">Newest scanned</SelectItem>
            <SelectItem value="applied">Newest applied</SelectItem>
            <SelectItem value="experience">Most experience</SelectItem>
            <SelectItem value="salary">Lowest salary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Candidate</TableHead>
              <TableHead>Primary skills</TableHead>
              <TableHead>Years</TableHead>
              <TableHead>Expected salary</TableHead>
              <TableHead>About</TableHead>
              <TableHead>Scanned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((c) => {
              const open = expanded === c.applicationId;
              return [
                <TableRow
                  key={c.applicationId}
                  className="cursor-pointer hover:bg-muted/50 align-top"
                  onClick={() => setExpanded(open ? null : c.applicationId)}
                >
                  <TableCell>
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {c.fullName}
                      {c.applicationCount > 1 && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-amber-500/60 text-amber-700 dark:text-amber-400"
                        >
                          Applied {c.applicationCount}×
                        </Badge>
                      )}
                      {c.onHold && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-sky-500/60 text-sky-700 dark:text-sky-400"
                          title={c.holdReason ?? undefined}
                        >
                          On hold
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {c.primarySkills.map((s) => (
                        <Badge key={s} variant="secondary" className="font-normal">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{c.yearsExperience ?? "—"}</TableCell>
                  <TableCell>{c.salaryNetEur.toLocaleString()} €</TableCell>
                  <TableCell className="max-w-sm whitespace-normal text-sm">{c.about}</TableCell>
                  <TableCell className="text-sm">{formatDate(c.scannedAt)}</TableCell>
                </TableRow>,
                open && (
                  <TableRow key={`${c.applicationId}-details`} className="bg-muted/30 hover:bg-muted/30">
                    <TableCell />
                    <TableCell colSpan={6} className="whitespace-normal py-4">
                      <div className="grid gap-4 max-w-4xl">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Summary</p>
                          <p className="text-sm">{c.summary}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">All skills</p>
                          <div className="flex flex-wrap gap-1">
                            {c.allSkills.map((s) => (
                              <Badge key={s} variant="outline" className="font-normal">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Applied for {c.jobTitle}
                            {c.roleName && ` (${c.roleName})`} on {formatDate(c.appliedAt)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/ctrl/applications/${c.applicationId}`)}
                          >
                            Open application
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              ];
            })}
            {candidates.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {total === 0 && !search && !skills && !minYears && !maxSalary && !roleId
                    ? "No scanned candidates yet. Click “Scan new CVs” to read them."
                    : "No candidates match these filters"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-muted-foreground">
          {total} candidate{total === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm px-2">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </CmsShell>
  );
}
