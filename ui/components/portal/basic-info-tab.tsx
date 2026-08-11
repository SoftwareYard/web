"use client";

import { useEffect, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cmsApi } from "@/lib/cms-api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  secondContactName: string | null;
  secondContactPhone: string | null;
}

const profileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  secondContactName: z.string().optional(),
  secondContactPhone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function toDateInputValue(val: string | null): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function BasicInfoTab() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: "",
      address: "",
      dateOfBirth: "",
      secondContactName: "",
      secondContactPhone: "",
    },
  });

  const loadProfile = useCallback(async () => {
    const data = await cmsApi<{ member: Profile }>("/api/portal-auth/me");
    setProfile(data.member);
    form.reset({
      phone: data.member.phone ?? "",
      address: data.member.address ?? "",
      dateOfBirth: toDateInputValue(data.member.dateOfBirth),
      secondContactName: data.member.secondContactName ?? "",
      secondContactPhone: data.member.secondContactPhone ?? "",
    });
  }, [form]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (values: ProfileFormValues) => {
    try {
      await cmsApi("/api/portal-auth/me", {
        method: "PUT",
        body: JSON.stringify(values),
      });
      toast.success("Saved");
      loadProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes");
    }
  };

  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{profile.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telephone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address of Living</FormLabel>
                  <FormControl>
                    <Input placeholder="Street, city, country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="secondContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Second Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. spouse, parent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Second Contact Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
