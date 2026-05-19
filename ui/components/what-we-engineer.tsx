"use client"

import { useRef } from "react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"
import { Bot, LayoutDashboard, Zap, Plug, Users, Cloud } from "lucide-react"

const engineeringAreas = [
  {
    icon: Bot,
    title: "AI Assistants",
    description: "Custom intelligent assistants that automate conversations, answer queries, and enhance user experience.",
  },
  {
    icon: LayoutDashboard,
    title: "Internal Business Platforms",
    description: "Tailored dashboards and tools that streamline operations and give your team a unified workspace.",
  },
  {
    icon: Zap,
    title: "Automation Systems",
    description: "End-to-end workflows that eliminate repetitive tasks and accelerate your business processes.",
  },
  {
    icon: Plug,
    title: "API Integrations",
    description: "Seamless connections between your existing tools, third-party services, and data sources.",
  },
  {
    icon: Users,
    title: "Customer Portals",
    description: "Branded self-service portals that empower your customers and reduce support overhead.",
  },
  {
    icon: Cloud,
    title: "Cloud Infrastructure",
    description: "Scalable, secure cloud architectures designed for reliability and cost efficiency.",
  },
]

function EngineeringCard({
  area,
  index,
}: {
  area: (typeof engineeringAreas)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const Icon = area.icon

  return (
    <div
      ref={ref}
      className={cn(
        "group p-8 rounded-2xl bg-card border border-border hover:border-foreground/20 hover:shadow-lg transition-all opacity-0",
        isInView && "opacity-100 animate-fade-in-up"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <h3 className="text-lg font-semibold mb-3">{area.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{area.description}</p>
    </div>
  )
}

export function WhatWeEngineerSection() {
  const headerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(headerRef, { once: true })

  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div
          ref={headerRef}
          className={cn(
            "text-center max-w-3xl mx-auto mb-16 opacity-0",
            isInView && "opacity-100 animate-fade-in-up"
          )}
        >
          <span className="text-sm font-medium text-accent uppercase tracking-wider">
            Our Craft
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-balance">
            What We Engineer
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            From AI-powered tools to robust cloud systems — we build the software that moves your business forward.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {engineeringAreas.map((area, index) => (
            <EngineeringCard key={area.title} area={area} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
