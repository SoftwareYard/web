"use client"

import { useRef } from "react"
import { Users, Smartphone, Bot, Shield, ArrowUpRight } from "lucide-react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

const services = [
  {
    icon: Users,
    title: "Dedicated Teams",
    description:
      "Engineers who work as part of your team, on your tools and your schedule. Scale up or down as the project needs.",
  },
  {
    icon: Smartphone,
    title: "Web and Mobile App Development",
    description:
      "Custom applications built from idea to launch, including design, development, cloud setup, and ongoing support.",
  },
  {
    icon: Bot,
    title: "AI and Automation",
    description:
      "AI assistants, workflow automation, and integrations that connect the tools you already use and cut out repetitive work.",
  },
  {
    icon: Shield,
    title: "Quality Assurance",
    description:
      "Manual and automated testing, including performance, security, and accessibility, for your product or ours.",
  },
]

function ServiceCard({
  service,
  index,
  centerLastRow,
}: {
  service: (typeof services)[0]
  index: number
  centerLastRow: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <div
      ref={ref}
      className={cn(
        "group relative p-8 rounded-3xl transition-all duration-500 opacity-0 h-full flex flex-col",
        "bg-card border border-border hover:border-foreground/20",
        isInView && "opacity-100 animate-fade-in-up",
        centerLastRow && "lg:col-start-2"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 bg-secondary">
        <service.icon className="w-6 h-6 text-foreground" />
      </div>

      <h3 className="text-xl font-semibold mb-3 text-foreground">
        {service.title}
      </h3>

      <p className="leading-relaxed text-muted-foreground flex-1">
        {service.description}
      </p>

      <div className="absolute top-8 right-8 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-secondary">
        <ArrowUpRight className="w-5 h-5 text-foreground" />
      </div>
    </div>
  )
}

export function ServicesSection() {
  const headerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(headerRef, { once: true })

  return (
    <section id="services" className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div
          ref={headerRef}
          className={cn(
            "max-w-3xl mb-16 opacity-0",
            isInView && "opacity-100 animate-fade-in-up"
          )}
        >
          <span className="text-sm font-medium text-accent uppercase tracking-wider">
            Our Services
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-balance">
            Everything you need to build and scale
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            We provide end-to-end software development services that help businesses
            transform their ideas into reality and achieve their goals.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const isOrphan =
              index === services.length - 1 && services.length % 3 === 1
            return (
              <ServiceCard
                key={service.title}
                service={service}
                index={index}
                centerLastRow={isOrphan}
              />
            )
          })}
        </div>

        <p className="text-muted-foreground text-center mt-12 text-pretty">
          We also offer tech recruitment, data entry, customer support, and digital
          transformation consulting. Ask us about them.
        </p>
      </div>
    </section>
  )
}
