"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortalAuth } from "@/lib/portal-auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function PortalLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, member } = usePortalAuth();
  const router = useRouter();

  if (member) {
    router.replace("/portal");
    return null;
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const emailValue = form.querySelector<HTMLInputElement>('input[name="email"]')?.value ?? "";
    const passwordValue = form.querySelector<HTMLInputElement>('input[name="password"]')?.value ?? "";
    setLoading(true);
    setError("");
    try {
      await login(emailValue, passwordValue);
      router.replace("/portal");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Employee Time Off Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                placeholder="Email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                required
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
