"use client"

import { useRef } from "react"
import {
  Zap,
  Users,
  Database,
  Shield,
  Smartphone,
  Box,
  Cloud,
  FileInput,
  Headphones,
  ArrowUpRight,
} from "lucide-react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

const services = [
  {
    icon: Zap,
    title: "Digital Transformation",
    description:
      "From advice on your existing technology estate to hands-on coaching of development teams to optimize Agile practices, we ensure you leverage the full power of digital platforms.",
    featured: true,
  },
  {
    icon: Users,
    title: "Dedicated Resources",
    description:
      "We help you find the right people that will become the core tech team you can trust to deliver, or augment your current delivery team.",
    featured: false,
  },
  {
    icon: Database,
    title: "App & Data Integration",
    description:
      "We provide consultancy, implementation, migration and support services across proprietary enterprise integration products and open-source solutions.",
    featured: false,
  },
  {
    icon: Shield,
    title: "Quality Assurance",
    description:
      "Application Testing, Performance Testing, Test Automation, Security Testing, Usability Testing, Accessibility Testing, Consulting and Workshops.",
    featured: false,
  },
  {
    icon: Smartphone,
    title: "App Development",
    description:
      "We create and build bespoke mobile and web applications that are user-friendly, scalable, and secure. From idea to deployment, our team provides solutions that meet your business goals.",
    featured: true,
  },
  {
    icon: Box,
    title: "Product Development",
    description:
      "With experience bringing companies from initial concept validation through to funding acquisition, you can have confidence that we will challenge, support and advise on the best product development path.",
    featured: false,
  },
  {
    icon: Cloud,
    title: "Cloud Solutions",
    description:
      "With expert cloud solutions, we can offer advice through to implementation of cloud-based systems that scale with your business needs.",
    featured: false,
  },
  {
    icon: FileInput,
    title: "Data Entry",
    description:
      "We create and maintain databases, always striving to include the newest customer and account details. Our team can successfully manage large amounts of information.",
    featured: false,
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description:
      "Every complaint or issue regarding a product and/or service is promptly taken care of by our specialists skilled to deal with customer challenges.",
    featured: false,
  },
]

function ServiceCard({
  service,
  index,
}: {
  service: (typeof services)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <div
      ref={ref}
      className={cn(
        "group relative p-8 rounded-3xl transition-all duration-500 opacity-0 h-full flex flex-col",
        "bg-card border border-border hover:border-foreground/20",
        isInView && "opacity-100 animate-fade-in-up"
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
          {services.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
