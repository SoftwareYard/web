"use client"

import { useRef } from "react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

const technologies = [
  { name: "React", category: "Frontend" },
  { name: "Next.js", category: "Framework" },
  { name: "TypeScript", category: "Language" },
  { name: "Node.js", category: "Backend" },
  { name: "Python", category: "Backend" },
  { name: "PostgreSQL", category: "Database" },
  { name: "MongoDB", category: "Database" },
  { name: "AWS", category: "Cloud" },
  { name: "Docker", category: "DevOps" },
  { name: "Kubernetes", category: "DevOps" },
  { name: "GraphQL", category: "API" },
  { name: "Flutter", category: "Mobile" },
]

function TechCard({ tech, index }: { tech: (typeof technologies)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <div
      ref={ref}
      className={cn(
        "group p-6 rounded-2xl bg-card border border-border hover:border-foreground/20 transition-all cursor-pointer opacity-0",
        isInView && "opacity-100 animate-fade-in-up"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <span className="text-xl font-bold">{tech.name.charAt(0)}</span>
      </div>
      <h3 className="font-semibold mb-1">{tech.name}</h3>
      <span className="text-sm text-muted-foreground">{tech.category}</span>
    </div>
  )
}

export function TechStackSection() {
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
            Technology
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-balance">
            Built With Modern Tech
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            We use cutting-edge technologies to build scalable, performant, and secure solutions.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {technologies.map((tech, index) => (
            <TechCard key={tech.name} tech={tech} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
