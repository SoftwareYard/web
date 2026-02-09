"use client"

import { useRef } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div
          ref={ref}
          className={cn(
            "relative rounded-[2.5rem] bg-foreground overflow-hidden opacity-0",
            isInView && "opacity-100 animate-fade-in-up"
          )}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
            <div className="absolute top-10 right-10 w-72 h-72 rounded-full border border-background/50" />
            <div className="absolute bottom-10 right-40 w-96 h-96 rounded-full border border-background/30" />
            <div className="absolute top-1/2 right-20 w-48 h-48 rounded-full bg-background/20 blur-3xl" />
          </div>

          <div className="relative px-8 py-16 md:px-16 md:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 mb-6">
                <Sparkles className="w-4 h-4 text-background" />
                <span className="text-sm text-background/80">Let&apos;s build something great</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold text-background mb-6 text-balance">
                Considering using our services? We&apos;re here to assist you!
              </h2>

              <p className="text-lg text-background/70 mb-8 leading-relaxed">
                We want to fully understand your requirements so that we can offer the
                ideal solution. Let us know what you need, and we&apos;ll try to accommodate you.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="rounded-full px-8 bg-background text-foreground hover:bg-background/90 gap-2 group"
                >
                  Start a Conversation
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 border-background/20 text-background hover:bg-background/10 bg-transparent"
                >
                  Schedule a Call
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
