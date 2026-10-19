"use client";

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
import { ArrowDown, ArrowUp, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ctrl/image-upload";
import {
  caseStudyColors,
  type CaseStudy,
  type CaseStudyStat,
  type CaseStudyStep,
} from "@/lib/clients";

const caseStudySchema = z.object({
  name: z.string().min(1, "Client name is required"),
  slug: z.string().min(1, "Slug is required"),
  industry: z.string().min(1, "Industry is required"),
  location: z.string().min(1, "Location is required"),
  headline: z.string().min(1, "Headline is required"),
  summary: z.string().min(1, "Summary is required"),
  color: z.string().min(1, "Color is required"),
  logoImage: z.string().nullable(),
  logoOnDark: z.boolean(),
  coverImage: z.string().nullable(),
  challengeImage: z.string().nullable(),
  outcomeImage: z.string().nullable(),
  services: z.array(z.object({ value: z.string() })),
  technologies: z.array(z.object({ value: z.string() })),
  stats: z.array(z.object({ value: z.string(), label: z.string() })),
  challenge: z.string().min(1, "Challenge is required"),
  steps: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        image: z.string().nullable().optional(),
      })
    )
    .refine((steps) => steps.some((s) => s.title.trim()), "Add at least one step"),
  outcome: z.string().min(1, "Outcome is required"),
  testimonialQuote: z.string(),
  testimonialAuthor: z.string(),
  testimonialRole: z.string(),
  sortOrder: z.coerce.number().int(),
  isActive: z.boolean().default(true),
});

const UPLOAD_PATH = "/api/case-studies/images";

type CaseStudyFormValues = z.infer<typeof caseStudySchema>;

export type CaseStudyPayload = Omit<CaseStudy, "id">;

interface CaseStudyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CaseStudyPayload) => Promise<void>;
  defaultValues?: CaseStudy | null;
  nextSortOrder?: number;
}

function toFormValues(caseStudy: CaseStudy): CaseStudyFormValues {
  return {
    name: caseStudy.name,
    slug: caseStudy.slug,
    industry: caseStudy.industry,
    location: caseStudy.location,
    headline: caseStudy.headline,
    summary: caseStudy.summary,
    color: caseStudy.color,
    logoImage: caseStudy.logoImage,
    logoOnDark: caseStudy.logoOnDark,
    coverImage: caseStudy.coverImage,
    challengeImage: caseStudy.challengeImage,
    outcomeImage: caseStudy.outcomeImage,
    services: caseStudy.services.map((v) => ({ value: v })),
    technologies: caseStudy.technologies.map((v) => ({ value: v })),
    stats: caseStudy.stats,
    challenge: caseStudy.challenge,
    steps: caseStudy.steps,
    outcome: caseStudy.outcome,
    testimonialQuote: caseStudy.testimonialQuote ?? "",
    testimonialAuthor: caseStudy.testimonialAuthor ?? "",
    testimonialRole: caseStudy.testimonialRole ?? "",
    sortOrder: caseStudy.sortOrder,
    isActive: caseStudy.isActive,
  };
}

// Detects white/light logos so they can be shown on a dark background
async function isLightImage(file: File): Promise<boolean> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0, 64, 64);
    const { data } = ctx.getImageData(0, 0, 64, 64);
    let light = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      count++;
      if (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] > 200) light++;
    }
    // Opaque logos (e.g. JPGs with a background) are fine on any background
    if (count > (data.length / 4) * 0.9) return false;
    // Nearly all visible pixels near-white; colourful artwork with pale areas is not
    return count > 0 && light / count > 0.85;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ListHeader({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <FormLabel>{label}</FormLabel>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="w-3 h-3 mr-1" />
        Add
      </Button>
    </div>
  );
}

function ArrayField({
  label,
  name,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control,
}: {
  label: string;
  name: "services" | "technologies";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
}) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="space-y-2">
      <ListHeader label={label} onAdd={() => append({ value: "" })} />
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

export function CaseStudyForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  nextSortOrder = 0,
}: CaseStudyFormProps) {
  const form = useForm<CaseStudyFormValues>({
    resolver: zodResolver(caseStudySchema),
    defaultValues: {
      name: "",
      slug: "",
      industry: "",
      location: "",
      headline: "",
      summary: "",
      color: caseStudyColors[0].value,
      logoImage: null,
      logoOnDark: false,
      coverImage: null,
      challengeImage: null,
      outcomeImage: null,
      services: [{ value: "" }],
      technologies: [{ value: "" }],
      stats: [{ value: "", label: "" }],
      challenge: "",
      steps: [{ title: "", description: "", image: null }],
      outcome: "",
      testimonialQuote: "",
      testimonialAuthor: "",
      testimonialRole: "",
      sortOrder: nextSortOrder,
      isActive: true,
    },
    values: defaultValues ? toFormValues(defaultValues) : undefined,
  });

  const stats = useFieldArray({ control: form.control, name: "stats" });
  const steps = useFieldArray({ control: form.control, name: "steps" });

  const handleSubmit = async (values: CaseStudyFormValues) => {
    const clean = (items: { value: string }[]) =>
      items.map((i) => i.value.trim()).filter(Boolean);

    await onSubmit({
      ...values,
      services: clean(values.services),
      technologies: clean(values.technologies),
      stats: values.stats.filter((s): s is CaseStudyStat => !!s.value.trim()),
      steps: values.steps.filter((s): s is CaseStudyStep => !!s.title.trim()),
      testimonialQuote: values.testimonialQuote.trim() || null,
      testimonialAuthor: values.testimonialAuthor.trim() || null,
      testimonialRole: values.testimonialRole.trim() || null,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit Case Study" : "New Case Study"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Client */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VPAR"
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
                        <Input placeholder="vpar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="Sports & Leisure" {...field} />
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
                        <Input placeholder="United Kingdom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Scaling a golf platform used by clubs worldwide"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary (shown on the card)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Color</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {caseStudyColors.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <span className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "w-4 h-4 rounded bg-gradient-to-br",
                                  color.value
                                )}
                              />
                              {color.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Logo + cover */}
            <div className="flex gap-4">
              <div className="space-y-2">
                <FormLabel>Logo</FormLabel>
                <FormField
                  control={form.control}
                  name="logoImage"
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      uploadPath={UPLOAD_PATH}
                      fit="contain"
                      className="w-32 h-32"
                      darkBackground={form.watch("logoOnDark")}
                      onFileSelected={async (file) =>
                        form.setValue("logoOnDark", await isLightImage(file))
                      }
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="logoOnDark"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 w-32">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 text-xs font-normal leading-tight">
                        Light logo (dark background)
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2 flex-1">
                <FormLabel>Cover Image (card &amp; page header)</FormLabel>
                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      uploadPath={UPLOAD_PATH}
                      className="h-32"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ArrayField label="Services" name="services" control={form.control} />
              <ArrayField
                label="Technologies"
                name="technologies"
                control={form.control}
              />
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <ListHeader
                label="Stats"
                onAdd={() => stats.append({ value: "", label: "" })}
              />
              {stats.fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`stats.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="w-40">
                        <FormControl>
                          <Input {...field} placeholder="20+" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`stats.${index}.label`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...field} placeholder="Projects delivered" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => stats.remove(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="challenge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>The Challenge</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Textarea rows={4} className="flex-1" {...field} />
                    </FormControl>
                    <FormField
                      control={form.control}
                      name="challengeImage"
                      render={({ field: imageField }) => (
                        <ImageUpload
                          value={imageField.value}
                          onChange={imageField.onChange}
                          uploadPath={UPLOAD_PATH}
                          className="w-36 h-[6.5rem] flex-shrink-0"
                        />
                      )}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Steps */}
            <FormField
              control={form.control}
              name="steps"
              render={() => (
                <FormItem className="space-y-2">
                  <ListHeader
                    label="What We Did (steps)"
                    onAdd={() =>
                      steps.append({ title: "", description: "", image: null })
                    }
                  />
                  {steps.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex gap-2 p-3 rounded-lg border bg-muted/30"
                    >
                      <span className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-1">
                        {index + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        <FormField
                          control={form.control}
                          name={`steps.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="Step title" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`steps.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  rows={2}
                                  {...field}
                                  placeholder="What we did in this step..."
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`steps.${index}.image`}
                        render={({ field }) => (
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            uploadPath={UPLOAD_PATH}
                            className="w-32 h-[6.5rem] flex-shrink-0"
                          />
                        )}
                      />
                      <div className="flex flex-col">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          onClick={() => steps.move(index, index - 1)}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === steps.fields.length - 1}
                          onClick={() => steps.move(index, index + 1)}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => steps.remove(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>The Outcome</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Textarea rows={4} className="flex-1" {...field} />
                    </FormControl>
                    <FormField
                      control={form.control}
                      name="outcomeImage"
                      render={({ field: imageField }) => (
                        <ImageUpload
                          value={imageField.value}
                          onChange={imageField.onChange}
                          uploadPath={UPLOAD_PATH}
                          className="w-36 h-[6.5rem] flex-shrink-0"
                        />
                      )}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Testimonial */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="testimonialQuote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testimonial (optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Client quote..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="testimonialAuthor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input placeholder="Stephen Hyland" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="testimonialRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author Role</FormLabel>
                      <FormControl>
                        <Input placeholder="Head of Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                    <FormLabel className="!mt-0">Visible on website</FormLabel>
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
