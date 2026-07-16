"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const meetingSchema = z.object({
  date: z.string().min(1, "Date is required"),
  feelingAtWork: z.string().optional(),
  currentWorkload: z.string().optional(),
  thingsOutsideWork: z.string().optional(),
  problemsWithClient: z.string().optional(),
  problemsWithTeam: z.string().optional(),
  skillsToDevelop: z.string().optional(),
  growingInRole: z.string().optional(),
  trainingOpportunities: z.string().optional(),
  anythingElse: z.string().optional(),
  improvementSuggestions: z.string().optional(),
});

export type MeetingFormValues = z.infer<typeof meetingSchema>;

interface MeetingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MeetingFormValues) => Promise<void>;
}

export function MeetingForm({ open, onOpenChange, onSubmit }: MeetingFormProps) {
  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      feelingAtWork: "",
      currentWorkload: "",
      thingsOutsideWork: "",
      problemsWithClient: "",
      problemsWithTeam: "",
      skillsToDevelop: "",
      growingInRole: "",
      trainingOpportunities: "",
      anythingElse: "",
      improvementSuggestions: "",
    },
  });

  const handleSubmit = async (values: MeetingFormValues) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New 1-on-1 Meeting</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feelingAtWork"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feeling at Work</FormLabel>
                  <FormControl>
                    <Textarea rows={2} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentWorkload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Workload</FormLabel>
                  <FormControl>
                    <Textarea rows={2} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="thingsOutsideWork"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Things Outside Work</FormLabel>
                  <FormControl>
                    <Textarea rows={2} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="problemsWithClient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problems with Client</FormLabel>
                  <FormControl>
                    <Textarea rows={2} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="problemsWithTeam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problems with Team</FormLabel>
                  <FormControl>
                    <Textarea rows={2} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skillsToDevelop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills to Develop</FormLabel>
                  <FormControl>
                    <Textarea rows={2} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="growingInRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Growing in Role</FormLabel>
                  <FormControl>
                    <Textarea rows={2} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trainingOpportunities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Opportunities</FormLabel>
                  <FormControl>
                    <Textarea rows={2} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="improvementSuggestions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Improvement Suggestions</FormLabel>
                  <FormControl>
                    <Textarea rows={2} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="anythingElse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anything Else</FormLabel>
                  <FormControl>
                    <Textarea rows={2} className="resize-none" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
