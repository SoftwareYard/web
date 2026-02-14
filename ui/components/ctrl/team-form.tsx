"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { cmsApi } from "@/lib/cms-api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";

interface CandidateRole {
  id: string;
  name: string;
}

const teamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  bio: z.string().default(""),
  email: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  hireDate: z.string().optional(),
  currentSalaryEur: z.string().optional(),
  nextContractDate: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
});

export type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => Promise<void>;
  defaultValues?: Record<string, unknown> | null;
}

function toDateInputValue(val: unknown): string {
  if (!val) return "";
  const d = new Date(val as string);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function TeamForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: TeamFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [roles, setRoles] = useState<CandidateRole[]>([]);

  useEffect(() => {
    cmsApi<CandidateRole[]>("/api/team/roles").then(setRoles).catch(() => {});
  }, []);

  const defaults: TeamFormValues = {
    name: "",
    role: "",
    bio: "",
    email: "",
    phone: "",
    hireDate: "",
    currentSalaryEur: "",
    nextContractDate: "",
    sortOrder: 0,
  };

  if (defaultValues) {
    defaults.name = (defaultValues.name as string) || "";
    defaults.role = (defaultValues.role as string) || "";
    defaults.bio = (defaultValues.bio as string) || "";
    defaults.email = (defaultValues.email as string) || "";
    defaults.phone = (defaultValues.phone as string) || "";
    defaults.hireDate = toDateInputValue(defaultValues.hireDate);
    defaults.currentSalaryEur = defaultValues.currentSalaryEur
      ? String(defaultValues.currentSalaryEur)
      : "";
    defaults.nextContractDate = toDateInputValue(defaultValues.nextContractDate);
    defaults.sortOrder = (defaultValues.sortOrder as number) ?? 0;
  }

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: defaults,
  });

  const handleSubmit = async (values: TeamFormValues) => {
    const fd = new FormData();
    fd.append("name", values.name);
    fd.append("role", values.role);
    fd.append("bio", values.bio || "");
    fd.append("email", values.email || "");
    fd.append("phone", values.phone || "");
    fd.append("hireDate", values.hireDate || "");
    fd.append("currentSalaryEur", values.currentSalaryEur || "");
    fd.append("nextContractDate", values.nextContractDate || "");
    fd.append("sortOrder", String(values.sortOrder));
    if (imageFile) {
      fd.append("image", imageFile);
    }
    await onSubmit(fd);
    form.reset();
    setImageFile(null);
    setFileName("");
  };

  const currentImage = defaultValues?.image as string | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit Team Member" : "New Team Member"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Photo</label>
              {currentImage && !imageFile && (
                <div className="mb-2">
                  <img
                    src={currentImage}
                    alt="Current"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    setFileName(file.name);
                  }
                }}
              />
              {fileName ? (
                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                  <span className="text-sm truncate flex-1">{fileName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setImageFile(null);
                      setFileName("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              )}
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Short bio..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@softwareyard.co"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+389 XX XXX XXX"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hire Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentSalaryEur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Salary (EUR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nextContractDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Contract</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
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
