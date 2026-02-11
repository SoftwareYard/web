"use client";

import { CmsShell } from "@/components/ctrl/cms-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, Briefcase } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cmsApi } from "@/lib/cms-api";

export default function CtrlDashboard() {
  const [teamCount, setTeamCount] = useState(0);
  const [jobsCount, setJobsCount] = useState(0);

  useEffect(() => {
    cmsApi<unknown[]>("/api/team").then((data) => setTeamCount(data.length));
    cmsApi<unknown[]>("/api/jobs?all=true").then((data) =>
      setJobsCount(data.length)
    );
  }, []);

  return (
    <CmsShell>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/ctrl/team">
          <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> Team Members
              </CardTitle>
              <CardDescription>{teamCount} members</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/ctrl/jobs">
          <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> Job Openings
              </CardTitle>
              <CardDescription>{jobsCount} jobs</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </CmsShell>
  );
}
