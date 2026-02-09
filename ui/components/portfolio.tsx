"use client"

import { useRef, useState } from "react"
import { ArrowUpRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

const categories = ["All", "Web Apps", "Mobile", "E-commerce", "Enterprise"]

const projects = [
  {
    title: "VPAR Golf Platform",
    category: "Web Apps",
    description: "A comprehensive golf scoring and tournament management platform used by clubs worldwide.",
    tags: ["React", "Node.js", "PostgreSQL"],
    color: "from-emerald-500/20 to-teal-500/20",
  },
  {
    title: "VSC Management System",
    category: "Enterprise",
    description: "End-to-end business management solution with real-time analytics and reporting.",
    tags: ["Next.js", "TypeScript", "AWS"],
    color: "from-blue-500/20 to-indigo-500/20",
  },
  {
    title: "E-Commerce Platform",
    category: "E-commerce",
    description: "Scalable multi-vendor marketplace with integrated payment processing.",
    tags: ["React Native", "Stripe", "Firebase"],
    color: "from-orange-500/20 to-red-500/20",
  },
  {
    title: "Healthcare App",
    category: "Mobile",
    description: "Patient management and telemedicine application with secure video calls.",
    tags: ["Flutter", "WebRTC", "HIPAA"],
    color: "from-pink-500/20 to-rose-500/20",
  },
  {
    title: "Fintech Dashboard",
    category: "Web Apps",
    description: "Real-time financial analytics dashboard with AI-powered insights.",
    tags: ["Vue.js", "Python", "ML"],
    color: "from-violet-500/20 to-purple-500/20",
  },
  {
    title: "Logistics Platform",
    category: "Enterprise",
    description: "Fleet management and route optimization system with GPS tracking.",
    tags: ["Angular", "Go", "MongoDB"],
    color: "from-cyan-500/20 to-sky-500/20",
  },
]

function ProjectCard({
  project,
  index,
}: {
  project: (typeof projects)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <div
      ref={ref}
      className={cn(
        "group relative rounded-3xl overflow-hidden border border-border bg-card opacity-0 cursor-pointer",
        isInView && "opacity-100 animate-fade-in-up"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Project Preview */}
      <div
        className={cn(
          "aspect-[4/3] bg-gradient-to-br transition-all duration-500 group-hover:scale-105",
          project.color
        )}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-3/4 h-3/4 rounded-xl bg-background/50 backdrop-blur-sm shadow-lg flex items-center justify-center">
            <span className="text-lg font-semibold text-foreground/50">{project.title}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-semibold mb-1 group-hover:text-accent transition-colors">
              {project.title}
            </h3>
            <span className="text-sm text-muted-foreground">{project.category}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-foreground transition-colors">
            <ArrowUpRight className="w-5 h-5 group-hover:text-background transition-colors" />
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-xs font-medium bg-secondary rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PortfolioSection() {
  const [activeCategory, setActiveCategory] = useState("All")
  const headerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(headerRef, { once: true })

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory)

  return (
    <section id="portfolio" className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div
          ref={headerRef}
          className={cn(
            "flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 opacity-0",
            isInView && "opacity-100 animate-fade-in-up"
          )}
        >
          <div>
            <span className="text-sm font-medium text-accent uppercase tracking-wider">
              Our Work
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 text-balance">
              Featured Projects
            </h2>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full transition-all",
                  activeCategory === category
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.title} project={project} index={index} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="rounded-full px-8 gap-2 bg-transparent">
            View All Projects
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
