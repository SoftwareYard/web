"use client"

import { useRef } from "react"
import { MessageSquare, PenTool, Code2, Rocket } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

interface Step {
  icon: LucideIcon
  number: string
  title: string
  description: string
}

const steps: Step[] = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Discovery",
    description:
      "We start by understanding your business goals, challenges, and requirements through in-depth consultations.",
  },
  {
    icon: PenTool,
    number: "02",
    title: "Design",
    description:
      "Our designers create intuitive, user-centered designs that align with your brand and delight your users.",
  },
  {
    icon: Code2,
    number: "03",
    title: "Development",
    description:
      "Our expert developers bring designs to life with clean, scalable code using the latest technologies.",
  },
  {
    icon: Rocket,
    number: "04",
    title: "Launch & Support",
    description:
      "We deploy your solution and provide ongoing support to ensure continued success and growth.",
  },
]

function StepCard({ step, index, isLast }: { step: Step; index: number; isLast: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const Icon = step.icon

  return (
    <div
      ref={ref}
      className={cn(
        "relative opacity-0",
        isInView && "opacity-100 animate-fade-in-up"
      )}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Connector line */}
      {!isLast && (
        <div className="hidden lg:block absolute top-12 left-1/2 w-full h-px bg-border" />
      )}

      <div className="relative bg-card rounded-3xl p-8 border border-border hover:border-foreground/20 transition-colors h-full">
        {/* Number badge */}
        <div className="absolute -top-4 left-8 px-4 py-1 bg-foreground text-background text-sm font-bold rounded-full">
          {step.number}
        </div>

        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6 mt-2">
          <Icon className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
        <p className="text-muted-foreground leading-relaxed">
          {step.description}
        </p>
      </div>
    </div>
  )
}

export function ProcessSection() {
  const headerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(headerRef, { once: true })

  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div
          ref={headerRef}
          className={cn(
            "text-center max-w-3xl mx-auto mb-16 opacity-0",
            isInView && "opacity-100 animate-fade-in-up"
          )}
        >
          <span className="text-sm font-medium text-accent uppercase tracking-wider">
            Our Process
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-balance">
            How We Work
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Our proven process ensures every project is delivered on time, on budget,
            and exceeds expectations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <StepCard
              key={step.number}
              step={step}
              index={index}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
