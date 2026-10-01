"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, X } from "lucide-react";
import { cmsApi } from "@/lib/cms-api";

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  department: z.string().min(1, "Department is required"),
  location: z.string().min(1, "Location is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().min(1, "Description is required"),
  technologyId: z.string().min(1, "Technology is required"),
  requirements: z.array(z.object({ value: z.string() })),
  responsibilities: z.array(z.object({ value: z.string() })),
  goodToHave: z.array(z.object({ value: z.string() })),
  postedDate: z.string().min(1, "Date is required"),
  isActive: z.boolean().default(true),
});

export type JobFormValues = z.infer<typeof jobSchema>;

interface JobData {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  goodToHave: string[];
  technologyId: string | null;
  postedDate: string;
  isActive: boolean;
}

interface Technology {
  id: string;
  name: string;
}

interface JobFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    title: string;
    slug: string;
    department: string;
    location: string;
    type: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    goodToHave: string[];
    technologyId: string;
    postedDate: string;
    isActive: boolean;
  }) => Promise<void>;
  defaultValues?: JobData | null;
}

function toFormValues(job: JobData): JobFormValues {
  return {
    title: job.title,
    slug: job.slug,
    department: job.department,
    location: job.location,
    type: job.type,
    description: job.description,
    technologyId: job.technologyId ?? "",
    requirements: job.requirements.map((v) => ({ value: v })),
    responsibilities: job.responsibilities.map((v) => ({ value: v })),
    goodToHave: (job.goodToHave ?? []).map((v) => ({ value: v })),
    postedDate: job.postedDate.split("T")[0],
    isActive: job.isActive,
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ArrayField({
  label,
  name,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control,
}: {
  label: string;
  name: "requirements" | "responsibilities" | "goodToHave";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
}) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel>{label}</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ value: "" })}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <FormField
            control={control}
            name={`${name}.${index}.value`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} placeholder={`${label} item...`} />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export function JobForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: JobFormProps) {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [newTechInput, setNewTechInput] = useState("");
  const [addingTech, setAddingTech] = useState(false);

  const loadTechnologies = () =>
    cmsApi<Technology[]>("/api/technologies").then(setTechnologies).catch(() => {});

  useEffect(() => {
    if (open) loadTechnologies();
  }, [open]);

  const handleAddTech = async () => {
    const name = newTechInput.trim();
    if (!name) return;
    const existing = technologies.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
    try {
      const technology =
        existing ??
        (await cmsApi<Technology>("/api/technologies", {
          method: "POST",
          body: JSON.stringify({ name }),
        }));
      await loadTechnologies();
      form.setValue("technologyId", technology.id, { shouldValidate: true });
      setNewTechInput("");
      setAddingTech(false);
    } catch {
      // technology already exists or other error
    }
  };

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      slug: "",
      department: "",
      location: "",
      type: "Full-time",
      description: "",
      technologyId: "",
      requirements: [{ value: "" }],
      responsibilities: [{ value: "" }],
      goodToHave: [{ value: "" }],
      postedDate: new Date().toISOString().split("T")[0],
      isActive: true,
    },
    values: defaultValues ? toFormValues(defaultValues) : undefined,
  });

  const handleSubmit = async (values: JobFormValues) => {
    await onSubmit({
      ...values,
      requirements: values.requirements
        .map((r) => r.value)
        .filter((v) => v.trim()),
      responsibilities: values.responsibilities
        .map((r) => r.value)
        .filter((v) => v.trim()),
      goodToHave: values.goodToHave
        .map((r) => r.value)
        .filter((v) => v.trim()),
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit Job" : "New Job Opening"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Senior Developer"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (!defaultValues) {
                            form.setValue("slug", slugify(e.target.value));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="senior-developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Remote" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Remote">Remote</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="technologyId"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Technology</FormLabel>
                    {!addingTech && (
                      <button
                        type="button"
                        onClick={() => setAddingTech(true)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="w-3 h-3" /> Add technology
                      </button>
                    )}
                  </div>
                  {addingTech ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="New technology name"
                        value={newTechInput}
                        onChange={(e) => setNewTechInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTech())}
                        autoFocus
                      />
                      <Button type="button" size="sm" onClick={handleAddTech}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => { setAddingTech(false); setNewTechInput(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select technology" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {technologies.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Job description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ArrayField
              label="Requirements"
              name="requirements"
              control={form.control}
            />
            <ArrayField
              label="Responsibilities"
              name="responsibilities"
              control={form.control}
            />
            <ArrayField
              label="Good to have"
              name="goodToHave"
              control={form.control}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posted Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 pt-6">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : defaultValues ? (
                  "Save Changes"
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
