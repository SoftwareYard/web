"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"
import type { CaseStudy } from "@/lib/clients"

interface ClientCardProps {
  client: CaseStudy
  index: number
}

export function ClientCard({ client, index }: ClientCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <Link href={`/clients/${client.slug}`}>
      <div
        ref={ref}
        className={cn(
          "group relative rounded-3xl overflow-hidden border border-border bg-card opacity-0 h-full flex flex-col",
          "hover:border-foreground/20 transition-colors",
          isInView && "opacity-100 animate-fade-in-up"
        )}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Preview */}
        <div className="overflow-hidden">
          <div
            className={cn(
              "relative aspect-[16/10] bg-gradient-to-br transition-transform duration-500 group-hover:scale-105 flex items-center justify-center",
              client.color
            )}
          >
            {client.coverImage ? (
              <Image
                src={client.coverImage}
                alt={client.name}
                fill
                className="object-cover"
              />
            ) : client.logoImage ? (
              <div className="relative w-1/2 h-1/3">
                <Image
                  src={client.logoImage}
                  alt={client.name}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <span className="text-3xl md:text-4xl font-bold text-foreground/60">
                {client.name}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              {client.logoImage && (
                <span className="relative w-6 h-6">
                  <Image
                    src={client.logoImage}
                    alt=""
                    fill
                    className="object-contain"
                  />
                </span>
              )}
              {client.name}
            </span>
            <span className="px-3 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full">
              {client.industry}
            </span>
          </div>

          <h3 className="text-xl font-semibold mb-3 group-hover:text-accent transition-colors">
            {client.headline}
          </h3>

          <p className="text-muted-foreground text-sm mb-6 flex-1 line-clamp-3">
            {client.summary}
          </p>

          <div className="flex flex-wrap gap-2">
            {client.services.map((service) => (
              <span
                key={service}
                className="px-3 py-1 text-xs font-medium bg-secondary rounded-full"
              >
                {service}
              </span>
            ))}
          </div>
        </div>

        <div className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-5 h-5 text-foreground" />
        </div>
      </div>
    </Link>
  )
}
