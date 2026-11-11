"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, Ban, Layers, ChevronLeft, ChevronRight, Search, Sparkles } from "lucide-react";

interface CandidateRole {
  id: string;
  name: string;
}

interface JobApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  salaryNetEur: number;
  salaryGrossEur: number;
  jobTitle: string;
  roleId: string | null;
  role: CandidateRole | null;
  hrInterviewTime: string | null;
  applicationCount: number;
  onHold: boolean;
  createdAt: string;
}

interface PaginatedResponse {
  data: JobApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ApplicationsPage() {
  return (
    <Suspense>
      <ApplicationsList />
    </Suspense>
  );
}

function ApplicationsList() {
  const router = useRouter();
  const pathname = usePathname();
  // Paging and filters live in the URL, so Back from an application returns to the same view
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [roles, setRoles] = useState<CandidateRole[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get("page")) || 1));
  const [limit, setLimit] = useState(() =>
    [10, 25, 50].includes(Number(searchParams.get("limit"))) ? Number(searchParams.get("limit")) : 10
  );
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [roleFilter, setRoleFilter] = useState(() => searchParams.get("role") ?? "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(() =>
    searchParams.get("sort") === "asc" ? "asc" : "desc"
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (limit !== 10) params.set("limit", String(limit));
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (sortDir === "asc") params.set("sort", "asc");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [router, pathname, page, limit, search, roleFilter, sortDir]);

  const loadRoles = useCallback(async () => {
    const data = await cmsApi<CandidateRole[]>("/api/applications/roles");
    setRoles(data);
  }, []);

  const loadApplications = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortDir,
    });
    if (search) params.set("search", search);
    if (roleFilter) params.set("roleId", roleFilter);

    const res = await cmsApi<PaginatedResponse>(
      `/api/applications?${params.toString()}`
    );
    setApplications(res.data);
    setTotal(res.total);
    setTotalPages(res.totalPages);
  }, [page, limit, search, roleFilter, sortDir]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value === "all" ? "" : value);
    setPage(1);
  };

  const toggleSort = () => {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    setPage(1);
  };

  const handleLimitChange = (value: string) => {
    setLimit(Number(value));
    setPage(1);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <CmsShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Job Applications</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/ctrl/applications/by-job")}>
            <Layers className="w-4 h-4 mr-2" />
            By job post
          </Button>
          <Button variant="outline" onClick={() => router.push("/ctrl/applications/screening")}>
            <Sparkles className="w-4 h-4 mr-2" />
            AI Screening
          </Button>
          <Button variant="outline" onClick={() => router.push("/ctrl/applications/blocked")}>
            <Ban className="w-4 h-4 mr-2" />
            Blocked list
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter || "all"} onValueChange={handleRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Net Salary (EUR)</TableHead>
              <TableHead>Gross Salary (EUR)</TableHead>
              <TableHead>HR Interview</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={toggleSort}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Applied On
                  {sortDir === "desc" ? (
                    <ArrowDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUp className="w-3.5 h-3.5" />
                  )}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/ctrl/applications/${app.id}`)}>
                <TableCell className="font-medium">
                  {app.fullName}
                  {app.applicationCount > 1 && (
                    <Badge
                      variant="outline"
                      className="ml-2 border-amber-500/60 text-amber-700 dark:text-amber-400"
                      title={`${app.email} has applied ${app.applicationCount} times`}
                    >
                      Applied {app.applicationCount}×
                    </Badge>
                  )}
                  {app.onHold && (
                    <Badge variant="outline" className="ml-2 border-sky-500/60 text-sky-700 dark:text-sky-400">
                      On hold
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{app.email}</TableCell>
                <TableCell>
                  {app.role ? (
                    <Badge variant="secondary">{app.role.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{app.salaryNetEur.toLocaleString()}</TableCell>
                <TableCell>{app.salaryGrossEur.toLocaleString()}</TableCell>
                <TableCell>{formatDate(app.hrInterviewTime)}</TableCell>
                <TableCell>{formatDate(app.createdAt)}</TableCell>
              </TableRow>
            ))}
            {applications.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No applications found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {total > 0
              ? `Showing ${startRecord}-${endRecord} of ${total}`
              : "No results"}
          </span>
          <Select value={String(limit)} onValueChange={handleLimitChange}>
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>per page</span>
        </div>
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
