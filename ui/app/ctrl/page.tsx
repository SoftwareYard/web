"use client";

import { CmsShell } from "@/components/ctrl/cms-shell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, AlertCircle, FileWarning, Send, Loader2, Cake, DatabaseBackup } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cmsApi } from "@/lib/cms-api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface Invoice {
  paid: boolean;
  dueDate: string;
}

interface TeamMember {
  nextContractDate: string | null;
}

interface LatestBackup {
  fileName: string;
  sizeBytes: number;
  createdAt: string;
}

interface UpcomingBirthday {
  id: string;
  name: string;
  date: string;
  daysUntil: number;
}

export default function CtrlDashboard() {
  const { admin } = useAuth();
  const [teamCount, setTeamCount] = useState(0);
  const [jobsCount, setJobsCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueContractsCount, setOverdueContractsCount] = useState(0);
  const [sendingInvoices, setSendingInvoices] = useState(false);
  const [sendingContracts, setSendingContracts] = useState(false);
  const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([]);
  const [sendingBirthdays, setSendingBirthdays] = useState(false);
  const [runningBackup, setRunningBackup] = useState(false);
  const [latestBackup, setLatestBackup] = useState<LatestBackup | null>(null);
  const [latestBackupError, setLatestBackupError] = useState(false);

  const loadLatestBackup = useCallback(async () => {
    try {
      setLatestBackup(await cmsApi<LatestBackup | null>("/api/notifications/db-backup"));
      setLatestBackupError(false);
    } catch {
      setLatestBackupError(true);
    }
  }, []);

  const handleSendInvoices = async () => {
    setSendingInvoices(true);
    try {
      const { overdueCount } = await cmsApi<{ overdueCount: number }>(
        "/api/notifications/overdue-invoices",
        { method: "POST" }
      );
      toast.success(
        overdueCount === 0
          ? "No overdue invoices — nothing sent"
          : `Sent to Slack: ${overdueCount} overdue invoice${overdueCount !== 1 ? "s" : ""}`
      );
    } catch {
      toast.error("Failed to send Slack notification");
    } finally {
      setSendingInvoices(false);
    }
  };

  const handleSendContracts = async () => {
    setSendingContracts(true);
    try {
      const { overdueCount } = await cmsApi<{ overdueCount: number }>(
        "/api/notifications/overdue-contracts",
        { method: "POST" }
      );
      toast.success(
        overdueCount === 0
          ? "No overdue contracts — nothing sent"
          : `Sent to Slack: ${overdueCount} overdue contract${overdueCount !== 1 ? "s" : ""}`
      );
    } catch {
      toast.error("Failed to send Slack notification");
    } finally {
      setSendingContracts(false);
    }
  };

  const handleSendBirthdays = async () => {
    setSendingBirthdays(true);
    try {
      const { sentCount } = await cmsApi<{ sentCount: number }>(
        "/api/notifications/birthdays",
        { method: "POST" }
      );
      toast.success(
        sentCount === 0
          ? "No birthdays today — nothing sent"
          : `Sent to Slack: ${sentCount} birthday${sentCount !== 1 ? "s" : ""}`
      );
    } catch {
      toast.error("Failed to send Slack notification");
    } finally {
      setSendingBirthdays(false);
    }
  };

  const handleRunBackup = async () => {
    setRunningBackup(true);
    try {
      const { fileName, sizeBytes } = await cmsApi<{ fileName: string; sizeBytes: number }>(
        "/api/notifications/db-backup",
        { method: "POST" }
      );
      toast.success(`Backup uploaded: ${fileName} (${(sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
      loadLatestBackup();
    } catch {
      toast.error("Database backup failed");
    } finally {
      setRunningBackup(false);
    }
  };

  useEffect(() => {
    if (admin?.role === "SuperAdmin") loadLatestBackup();
  }, [admin, loadLatestBackup]);

  useEffect(() => {
    cmsApi<TeamMember[]>("/api/team").then((data) => {
      setTeamCount(data.length);
      const now = new Date();
      const overdue = data.filter(
        (m) => m.nextContractDate && new Date(m.nextContractDate) < now
      );
      setOverdueContractsCount(overdue.length);
    });
    cmsApi<unknown[]>("/api/jobs?all=true").then((data) =>
      setJobsCount(data.length)
    );
    cmsApi<Invoice[]>("/api/invoices").then((data) => {
      const now = new Date();
      const overdue = data.filter(
        (inv) => !inv.paid && new Date(inv.dueDate) < now
      );
      setOverdueCount(overdue.length);
    });
    cmsApi<UpcomingBirthday[]>("/api/birthdays/upcoming").then(setBirthdays);
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
        <Card className="border-destructive/40">
          <Link href="/ctrl/invoices?overdue=true" className="hover:opacity-80 transition-opacity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" /> Overdue Invoices
              </CardTitle>
              <CardDescription>
                {overdueCount === 0
                  ? "No overdue invoices"
                  : `${overdueCount} invoice${overdueCount !== 1 ? "s" : ""} past due date`}
              </CardDescription>
            </CardHeader>
          </Link>
          <CardContent>
            <Button size="sm" variant="outline" onClick={handleSendInvoices} disabled={sendingInvoices}>
              {sendingInvoices ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Send to Slack
            </Button>
          </CardContent>
        </Card>
        <Card className="border-destructive/40">
          <Link href="/ctrl/team?overdue=true" className="hover:opacity-80 transition-opacity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <FileWarning className="w-5 h-5" /> Overdue Contracts
              </CardTitle>
              <CardDescription>
                {overdueContractsCount === 0
                  ? "No overdue contracts"
                  : `${overdueContractsCount} member${overdueContractsCount !== 1 ? "s" : ""} past next contract date`}
              </CardDescription>
            </CardHeader>
          </Link>
          <CardContent>
            <Button size="sm" variant="outline" onClick={handleSendContracts} disabled={sendingContracts}>
              {sendingContracts ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Send to Slack
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="w-5 h-5" /> Upcoming Birthdays
            </CardTitle>
            <CardDescription>
              {birthdays.length === 0
                ? "None in the next 7 days"
                : `${birthdays.length} in the next 7 days`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {birthdays.length > 0 && (
              <ul className="space-y-1 text-sm mb-3">
                {birthdays.map((b) => (
                  <li key={b.id} className="flex justify-between text-muted-foreground">
                    <span>{b.name}</span>
                    <span>
                      {b.daysUntil === 0
                        ? "Today"
                        : new Date(b.date).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button size="sm" variant="outline" onClick={handleSendBirthdays} disabled={sendingBirthdays}>
              {sendingBirthdays ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Send to Slack
            </Button>
          </CardContent>
        </Card>
        {admin?.role === "SuperAdmin" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DatabaseBackup className="w-5 h-5" /> Database Backup
              </CardTitle>
              <CardDescription>Runs automatically every Friday at 02:00</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {latestBackupError
                  ? "Couldn't load the last backup"
                  : latestBackup
                    ? `Last backup: ${new Date(latestBackup.createdAt).toLocaleString("en-GB", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} (${(latestBackup.sizeBytes / 1024 / 1024).toFixed(2)} MB)`
                    : "No backups yet"}
              </p>
              <Button size="sm" variant="outline" onClick={handleRunBackup} disabled={runningBackup}>
                {runningBackup ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <DatabaseBackup className="w-4 h-4 mr-1" />
                )}
                Back up now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </CmsShell>
  );
}
