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
  "24/7 Support Available",
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
            "grid lg:grid-cols-2 gap-16 items-center opacity-0",
            isInView && "opacity-100"
          )}
        >
          {/* Left Column - Image Grid */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div
                className={cn(
                  "space-y-4 opacity-0",
                  isInView && "animate-slide-in-left"
                )}
              >
                <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-foreground/5 to-foreground/10 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="text-6xl font-bold gradient-text">8+</div>
                      <div className="text-sm text-muted-foreground mt-2">Years of Excellence</div>
                    </div>
                  </div>
                </div>
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-4xl font-bold">50+</div>
                    <div className="text-sm text-muted-foreground mt-1">Team Members</div>
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "space-y-4 pt-8 opacity-0",
                  isInView && "animate-slide-in-left animation-delay-200"
                )}
              >
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-4xl font-bold text-background">150+</div>
                    <div className="text-sm text-background/70 mt-1">Projects Completed</div>
                  </div>
                </div>
                <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-secondary to-muted overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="text-4xl font-bold">99%</div>
                      <div className="text-sm text-muted-foreground mt-2">Client Retention</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-full shadow-lg">
              <span className="text-sm font-medium">Based in North Macedonia</span>
            </div>
          </div>

          {/* Right Column - Content */}
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
              Building Digital Excellence Since 2016
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
