"use client"

import { useRef } from "react"
import Link from "next/link"
import { MapPin, Clock, Briefcase, ArrowUpRight } from "lucide-react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"
import type { Job } from "@/lib/jobs"

interface JobCardProps {
  job: Job
  index: number
}

export function JobCard({ job, index }: JobCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <Link href={`/careers/${job.slug}`}>
      <div
        ref={ref}
        className={cn(
          "group relative p-8 rounded-3xl transition-all duration-500 opacity-0 h-full flex flex-col",
          "bg-card border border-border hover:border-foreground/20",
          isInView && "opacity-100 animate-fade-in-up"
        )}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="flex items-start justify-between mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full">
            {job.type}
          </span>
          <span className="text-sm text-muted-foreground">{job.department}</span>
        </div>

        <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-accent transition-colors">
          {job.title}
        </h3>

        <p className="text-muted-foreground mb-6 flex-1 line-clamp-2">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {job.location}
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" />
            {job.type}
          </div>
        </div>

        <div className="absolute top-8 right-8 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-secondary">
          <ArrowUpRight className="w-5 h-5 text-foreground" />
        </div>
      </div>
    </Link>
  )
}
