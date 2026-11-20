"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScheduleCallDialog } from "@/components/schedule-call-dialog"

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { left, top, width, height } = container.getBoundingClientRect()
      const x = (clientX - left - width / 2) / 25
      const y = (clientY - top - height / 2) / 25
      container.style.setProperty("--mouse-x", `${x}px`)
      container.style.setProperty("--mouse-y", `${y}px`)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden grid-pattern pt-20"
    >
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-accent/20 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-float animation-delay-300" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">          

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 animate-fade-in-up animation-delay-100 text-balance">
            Dedicated software engineers,{" "}
            <span className="gradient-text">without the agency price tag</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-200 text-pretty leading-relaxed">
            SoftwareYard builds web apps, mobile apps, and AI-powered tools for companies
            across Europe. Hire a dedicated team from North Macedonia or hand us the whole
            project.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
            <Button
              size="lg"
              className="rounded-full px-8"
              onClick={() => setScheduleOpen(true)}
            >
              Schedule a Call
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 bg-transparent" asChild>
              <Link href="/clients">See Our Work</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4 animate-fade-in-up animation-delay-300">
            Same working day as your team, CET hours.
          </p>

          {/* Proof line */}
          <p className="text-sm md:text-base text-muted-foreground mt-10 animate-fade-in-up animation-delay-400">
            <span className="text-foreground italic">&ldquo;Finished more than 20 projects together.&rdquo;</span>{" "}
            Nikola Maksimovski, Founder at VSC
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto animate-fade-in-up animation-delay-400">
            {[
              { value: "150+", label: "Projects Delivered" },
              { value: "18", label: "Team Members" },
              { value: "Since 2022", label: "" },
            ].map((stat) => (
              <div key={stat.value} className="text-center">
                <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
                {stat.label && (
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <ScheduleCallDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
    </section>
  )
}
