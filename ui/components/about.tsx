"use client"

import { useRef } from "react"
import { CheckCircle2 } from "lucide-react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

const features = [
  "Agile Development Methodology",
  "Transparent Communication",
  "On-Time Delivery",
  "Scalable Solutions",
  "Ongoing Support",
  "Security-First Approach",
]

export function AboutSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section id="about" className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div
          ref={ref}
          className={cn(
            "max-w-3xl opacity-0",
            isInView && "opacity-100"
          )}
        >
          {/* Content */}
          <div
            className={cn(
              "opacity-0",
              isInView && "animate-slide-in-right animation-delay-100"
            )}
          >
            <span className="text-sm font-medium text-accent uppercase tracking-wider">
              About Us
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-balance">
              Building Digital Excellence Since 2022
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              SoftwareYard is a dedicated team of developers, designers, and digital 
              strategists committed to helping businesses thrive in the digital age. 
              We combine technical expertise with creative thinking to deliver solutions 
              that make a real impact.
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Our approach is simple: understand your needs, design with purpose, build 
              with precision, and support with dedication. Every project we undertake is 
              a partnership, and your success is our success.
            </p>

            {/* Features list */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={feature}
                  className={cn(
                    "flex items-center gap-3 opacity-0",
                    isInView && "animate-fade-in-up"
                  )}
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
