"use client";

import { usePortalAuth } from "@/lib/portal-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function PortalGuard({ children }: { children: React.ReactNode }) {
  const { member, isLoading } = usePortalAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !member) {
      router.replace("/portal/login");
    }
  }, [member, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!member) return null;

  return <>{children}</>;
}
