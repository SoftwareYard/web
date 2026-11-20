"use client"

import { useRef } from "react"
import Image from "next/image"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

interface TeamMember {
  id: string
  name: string
  role: string
  image: string
  bio: string
}

function TeamCard({ member, index }: { member: TeamMember; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <div
      ref={ref}
      className={cn(
        "group relative opacity-0",
        isInView && "opacity-100 animate-fade-in-up"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative overflow-hidden rounded-2xl aspect-square mb-4">
        {member.image && !member.image.includes("placeholder") ? (
          <Image
            src={member.image || "/placeholder.svg"}
            alt={member.name}
            fill
            className="object-cover object-top"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-bold text-muted-foreground/30">
                {member.name.charAt(0)}
              </span>
            </div>
          </>
        )}
      </div>

      <h3 className="text-base font-semibold">{member.name}</h3>
      <p className="text-sm text-muted-foreground">{member.role}</p>
    </div>
  )
}

export function TeamSectionClient({ team }: { team: TeamMember[] }) {
  const headerRef = useRef<HTMLDivElement>(null)
  const isHeaderInView = useInView(headerRef, { once: true })

  return (
    <section id="team" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={headerRef}
          className={cn(
            "max-w-3xl mx-auto text-center mb-16 opacity-0",
            isHeaderInView && "opacity-100 animate-fade-in-up"
          )}
        >
          <span className="inline-block px-4 py-2 bg-secondary rounded-full text-sm font-medium mb-6">
            Our Team
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Meet the experts behind your success
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Developers, QA engineers, and specialists who work as part of your team.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {team.map((member, index) => (
            <TeamCard key={member.id} member={member} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
