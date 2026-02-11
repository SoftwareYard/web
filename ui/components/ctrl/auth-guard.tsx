"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) {
      router.replace("/ctrl/login");
    }
  }, [admin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!admin) return null;

  return <>{children}</>;
}
