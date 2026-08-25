"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, PhoneCall } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const MAX_DAYS_AHEAD = 7

interface ScheduleCallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function ScheduleCallDialog({ open, onOpenChange }: ScheduleCallDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [desiredTime, setDesiredTime] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) return
    const timeout = setTimeout(() => {
      setName("")
      setEmail("")
      setDesiredTime("")
      setSubmitted(false)
      setError("")
    }, 200)
    return () => clearTimeout(timeout)
  }, [open])

  const now = new Date()
  const maxDate = new Date(now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000)
  const min = toLocalDatetimeInput(now)
  const max = toLocalDatetimeInput(maxDate)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`${API_URL}/api/schedule-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, desiredTime }),
      })
      if (!res.ok) throw new Error("Failed to submit request")
      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {submitted ? (
          <div className="flex flex-col items-center text-center py-6 gap-3">
            <CheckCircle2 className="w-10 h-10 text-foreground" />
            <DialogTitle>Thanks, {name.split(" ")[0]}!</DialogTitle>
            <DialogDescription>
              We&apos;ve got your request for{" "}
              {new Date(desiredTime).toLocaleString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
              . We&apos;ll get back to you shortly to confirm.
            </DialogDescription>
            <Button onClick={() => onOpenChange(false)} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Schedule a Call</DialogTitle>
              <DialogDescription>
                Tell us when works for you in the next week and we&apos;ll reach out to confirm.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="schedule-name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <Input
                  id="schedule-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <label htmlFor="schedule-email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="schedule-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="schedule-time" className="block text-sm font-medium mb-2">
                  Desired Time
                </label>
                <Input
                  id="schedule-time"
                  type="datetime-local"
                  value={desiredTime}
                  onChange={(e) => setDesiredTime(e.target.value)}
                  min={min}
                  max={max}
                  required
                />
              </div>
            </div>

            {error && <p className="text-destructive text-sm mb-2">{error}</p>}

            <DialogFooter>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4" />
                    Request Call
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
