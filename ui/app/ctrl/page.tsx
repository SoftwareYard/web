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
import { Users, Briefcase, AlertCircle, FileWarning, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cmsApi } from "@/lib/cms-api";
import { toast } from "sonner";

interface Invoice {
  paid: boolean;
  dueDate: string;
}

interface TeamMember {
  nextContractDate: string | null;
}

export default function CtrlDashboard() {
  const [teamCount, setTeamCount] = useState(0);
  const [jobsCount, setJobsCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueContractsCount, setOverdueContractsCount] = useState(0);
  const [sendingInvoices, setSendingInvoices] = useState(false);
  const [sendingContracts, setSendingContracts] = useState(false);

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
      </div>
    </CmsShell>
  );
}
