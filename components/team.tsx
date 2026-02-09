"use client"

import { useRef } from "react"
import Image from "next/image"
import { Linkedin, Twitter, Github } from "lucide-react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

const team = [
  {
    name: "Sarah Chen",
    role: "CEO & Founder",
    image: "/team/sarah-chen.jpg",
    bio: "15+ years in tech leadership. Previously at Google and Microsoft.",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Marcus Johnson",
    role: "CTO",
    image: "/team/marcus.jpg",
    bio: "Full-stack architect with expertise in cloud infrastructure.",
    linkedin: "#",
    twitter: "#",
    github: "#",
  },
  {
    name: "Elena Rodriguez",
    role: "Head of Design",
    image: "/team/elena.jpg",
    bio: "Award-winning designer focused on user-centered experiences.",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "David Kim",
    role: "Lead Developer",
    image: "/team/david.jpg",
    bio: "Expert in React, Node.js, and modern web technologies.",
    linkedin: "#",
    github: "#",
  },
  {
    name: "Priya Patel",
    role: "Project Manager",
    image: "/team/priya.jpg",
    bio: "Agile certified PM with 10+ years delivering complex projects.",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "James Wilson",
    role: "DevOps Engineer",
    image: "/team/james.jpg",
    bio: "Kubernetes and AWS specialist. Automation enthusiast.",
    linkedin: "#",
    github: "#",
  },
]

function TeamCard({ member, index }: { member: (typeof team)[0]; index: number }) {
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
      {/* Card container with overflow hidden for the slide effect */}
      <div className="relative overflow-hidden rounded-2xl bg-foreground aspect-square mb-4">
        {/* Image container that slides up and left on hover */}
        <div className="absolute inset-0 transition-transform duration-300 ease-out group-hover:-translate-y-6 group-hover:-translate-x-6">
          {member.image === "/team/sarah-chen.jpg" ? (
            <Image
              src={member.image || "/placeholder.svg"}
              alt={member.name}
              fill
              className="object-cover"
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
        
        {/* Social links that appear in bottom right corner */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out">
          {member.linkedin && (
            <a
              href={member.linkedin}
              className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-foreground hover:bg-accent hover:text-background transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}
          {member.twitter && (
            <a
              href={member.twitter}
              className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-foreground hover:bg-accent hover:text-background transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
          )}
          {member.github && (
            <a
              href={member.github}
              className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-foreground hover:bg-accent hover:text-background transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      <h3 className="text-base font-semibold">{member.name}</h3>
      <p className="text-sm text-muted-foreground">{member.role}</p>
    </div>
  )
}

export function TeamSection() {
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
            Our diverse team of passionate professionals brings together decades
            of experience in software development, design, and project management.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {team.map((member, index) => (
            <TeamCard key={member.name} member={member} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
