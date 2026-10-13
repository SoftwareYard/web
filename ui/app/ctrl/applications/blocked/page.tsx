"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface BlockedApplicant {
  id: string;
  email: string;
  fullName: string | null;
  reason: string | null;
  createdAt: string;
}

export default function BlockedApplicantsPage() {
  const router = useRouter();
  const [blocked, setBlocked] = useState<BlockedApplicant[]>([]);

  const loadBlocked = useCallback(async () => {
    const data = await cmsApi<BlockedApplicant[]>("/api/applications/blocked");
    setBlocked(data);
  }, []);

  useEffect(() => {
    loadBlocked();
  }, [loadBlocked]);

  const handleUnblock = async (item: BlockedApplicant) => {
    try {
      await cmsApi(`/api/applications/blocked/${item.id}`, { method: "DELETE" });
      setBlocked((prev) => prev.filter((b) => b.id !== item.id));
      toast.success(`${item.email} unblocked`);
    } catch {
      toast.error("Failed to unblock applicant");
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <CmsShell>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="-ml-2 mb-4" onClick={() => router.push("/ctrl/applications")}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Job Applications
        </Button>
        <h1 className="text-2xl font-bold">Blocked Applicants</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Applications from these emails are ignored.
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Blocked</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocked.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.fullName ?? "—"}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell className="max-w-xs whitespace-normal">{item.reason ?? "—"}</TableCell>
                <TableCell>{formatDate(item.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleUnblock(item)}>
                    Unblock
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {blocked.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No blocked applicants
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </CmsShell>
  );
}
