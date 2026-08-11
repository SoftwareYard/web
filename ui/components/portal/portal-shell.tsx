"use client";

import { usePortalAuth } from "@/lib/portal-auth";
import { PortalGuard } from "./portal-guard";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { member, logout } = usePortalAuth();

  return (
    <PortalGuard>
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between border-b px-6 h-14">
          <div>
            <span className="font-semibold">Time Off Portal</span>
            <span className="text-xs text-muted-foreground ml-3">
              Logged in as {member?.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={async () => {
              await logout();
              window.location.href = "/portal/login";
            }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </PortalGuard>
  );
}
