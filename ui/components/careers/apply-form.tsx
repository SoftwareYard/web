"use client"

import { useState } from "react"
import { Send, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ApplyFormProps {
  jobTitle: string
}

export function ApplyForm({ jobTitle }: ApplyFormProps) {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-3xl p-8 md:p-10"
    >
      <h3 className="text-2xl font-semibold mb-6">Apply for this position</h3>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-2">
            Full Name
          </label>
          <Input
            id="fullName"
            placeholder="John Doe"
            className="rounded-xl h-12"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            className="rounded-xl h-12"
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-2">
            Phone (Optional)
          </label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            className="rounded-xl h-12"
          />
        </div>
        <div>
          <label htmlFor="linkedin" className="block text-sm font-medium mb-2">
            LinkedIn Profile (Optional)
          </label>
          <Input
            id="linkedin"
            type="url"
            placeholder="https://linkedin.com/in/username"
            className="rounded-xl h-12"
          />
        </div>
      </div>
     

      <div className="mb-8">
        <label htmlFor="coverLetter" className="block text-sm font-medium mb-2">
          Cover Letter
        </label>
        <Textarea
          id="coverLetter"
          placeholder="Tell us why you're interested in this role and what makes you a great fit..."
          rows={6}
          className="rounded-xl resize-none"
          required
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-full gap-2"
        disabled={submitted}
      >
        {submitted ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Application Sent!
          </>
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
