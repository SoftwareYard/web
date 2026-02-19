"use client"

import { useState, useRef } from "react"
import { Send, CheckCircle2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface ApplyFormProps {
  jobTitle: string
}

type FieldErrors = Record<string, string>

function validate(formData: FormData, file: File | null): FieldErrors {
  const errors: FieldErrors = {}

  const fullName = (formData.get("fullName") as string)?.trim()
  if (!fullName) errors.fullName = "Full name is required"

  const email = (formData.get("email") as string)?.trim()
  if (!email) {
    errors.email = "Email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address"
  }

  const phone = (formData.get("phone") as string)?.trim()
  if (!phone) errors.phone = "Phone number is required"

  const expectedSalary = (formData.get("expectedSalary") as string)?.trim()
  if (!expectedSalary) {
    errors.expectedSalary = "Expected net salary is required"
  } else if (!/^\d+$/.test(expectedSalary)) {
    errors.expectedSalary = "Please enter a valid number"
  }

  if (!file) errors.cv = "Please upload your CV"

  const linkedin = (formData.get("linkedin") as string)?.trim()
  if (linkedin && !/^https?:\/\/.+/.test(linkedin)) {
    errors.linkedin = "Please enter a valid URL"
  }

  const github = (formData.get("github") as string)?.trim()
  if (github && !/^https?:\/\/.+/.test(github)) {
    errors.github = "Please enter a valid URL"
  }

  return errors
}

export function ApplyForm({ jobTitle }: ApplyFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [fileName, setFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setFieldErrors((prev) => {
        const { cv: _, ...rest } = prev
        return rest
      })
    }
  }

  const clearFile = () => {
    setFileName("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const { [field]: _, ...rest } = prev
      return rest
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    const form = e.currentTarget
    const formData = new FormData(form)
    const file = fileInputRef.current?.files?.[0] ?? null

    const errors = validate(formData, file)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    formData.append("jobTitle", jobTitle)

    try {
      const res = await fetch(`${API_URL}/api/apply`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit application")
      }

      setSubmitted(true)
      form.reset()
      setFileName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-card border border-border rounded-3xl p-8 md:p-10 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Application Sent!</h3>
        <p className="text-muted-foreground">
          Thank you for applying. We&apos;ll review your application and get back to you soon.
        </p>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="bg-card border border-border rounded-3xl p-8 md:p-10"
    >
      <h3 className="text-2xl font-semibold mb-6">Apply for this position</h3>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-2">
            Full Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="fullName"
            name="fullName"
            placeholder=""
            className={`rounded-xl h-12 ${fieldErrors.fullName ? "border-destructive" : ""}`}
            onChange={() => clearFieldError("fullName")}
          />
          {fieldErrors.fullName && (
            <p className="text-destructive text-xs mt-1">{fieldErrors.fullName}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email <span className="text-destructive">*</span>
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder=""
            className={`rounded-xl h-12 ${fieldErrors.email ? "border-destructive" : ""}`}
            onChange={() => clearFieldError("email")}
          />
          {fieldErrors.email && (
            <p className="text-destructive text-xs mt-1">{fieldErrors.email}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-2">
            Phone <span className="text-destructive">*</span>
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder=""
            className={`rounded-xl h-12 ${fieldErrors.phone ? "border-destructive" : ""}`}
            onChange={() => clearFieldError("phone")}
          />
          {fieldErrors.phone && (
            <p className="text-destructive text-xs mt-1">{fieldErrors.phone}</p>
          )}
        </div>
        <div>
          <label htmlFor="expectedSalary" className="block text-sm font-medium mb-2">
            Expected Salary(eur) <span className="text-destructive">*</span>
          </label>
          <Input
            id="expectedSalary"
            name="expectedSalary"
            type="number"
            min="0"
            placeholder=""
            className={`rounded-xl h-12 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] ${fieldErrors.expectedSalary ? "border-destructive" : ""}`}
            onChange={() => clearFieldError("expectedSalary")}
          />
          {fieldErrors.expectedSalary && (
            <p className="text-destructive text-xs mt-1">{fieldErrors.expectedSalary}</p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="cv" className="block text-sm font-medium mb-2">
          CV / Resume <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <input
            ref={fileInputRef}
            id="cv"
            name="cv"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
          {fileName ? (
            <div className={`flex items-center gap-3 border rounded-xl h-12 px-4 ${fieldErrors.cv ? "border-destructive" : "border-border"}`}>
              <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1">{fileName}</span>
              <button
                type="button"
                onClick={clearFile}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="cv"
              className={`flex items-center gap-3 border border-dashed rounded-xl h-12 px-4 cursor-pointer hover:border-foreground/50 transition-colors ${fieldErrors.cv ? "border-destructive" : "border-border"}`}
            >
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Upload PDF
              </span>
            </label>
          )}
        </div>
        {fieldErrors.cv && (
          <p className="text-destructive text-xs mt-1">{fieldErrors.cv}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="linkedin" className="block text-sm font-medium mb-2">
            LinkedIn Profile <span className="text-muted-foreground text-xs">(Optional)</span>
          </label>
          <Input
            id="linkedin"
            name="linkedin"
            type="url"
            placeholder=""
            className={`rounded-xl h-12 ${fieldErrors.linkedin ? "border-destructive" : ""}`}
            onChange={() => clearFieldError("linkedin")}
          />
          {fieldErrors.linkedin && (
            <p className="text-destructive text-xs mt-1">{fieldErrors.linkedin}</p>
          )}
        </div>
        <div>
          <label htmlFor="github" className="block text-sm font-medium mb-2">
            GitHub <span className="text-muted-foreground text-xs">(Optional)</span>
          </label>
          <Input
            id="github"
            name="github"
            type="url"
            placeholder=""
            className={`rounded-xl h-12 ${fieldErrors.github ? "border-destructive" : ""}`}
            onChange={() => clearFieldError("github")}
          />
          {fieldErrors.github && (
            <p className="text-destructive text-xs mt-1">{fieldErrors.github}</p>
          )}
        </div>
      </div>

      <div className="mb-8">
        <label htmlFor="coverLetter" className="block text-sm font-medium mb-2">
          Cover Letter <span className="text-muted-foreground text-xs">(Optional)</span>
        </label>
        <Textarea
          id="coverLetter"
          name="coverLetter"
          placeholder=""
          rows={6}
          className="rounded-xl resize-none"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-full gap-2"
        disabled={submitting}
      >
        {submitting ? (
          "Submitting..."
        ) : (
          <>
            <Send className="w-5 h-5" />
            Submit Application
          </>
        )}
      </Button>
    </form>
  )
}
