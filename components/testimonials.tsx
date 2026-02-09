"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

const testimonials = [
  {
    quote:
      "The engineers provided by Software Yard were exactly what was required for our project and a good deal cheaper than other vendors we worked with, without compromising on quality. Very happy and will work with Software Yard again.",
    author: "Stephen Hyland",
    role: "Head of Technology",
    company: "VPAR",
    rating: 5,
    initials: "SH",
  },
  {
    quote:
      "Great cooperation, finished more than 20 projects together, and hope to continue. Innovative, consistent, and professional, you will find all within the Software Yard team, loving to work with them.",
    author: "Nikola Maksimovski",
    role: "Founder",
    company: "VSC",
    rating: 5,
    initials: "NM",
  },
  {
    quote:
      "I wholeheartedly recommend Software Yard to any business seeking a reliable, innovative, and dedicated B2B partner. Their commitment to excellence, combined with a customer-centric approach, sets them apart in the industry.",
    author: "Simon Carroll",
    role: "Co-Founder",
    company: "The Development Yard",
    rating: 5,
    initials: "SC",
  },
]

const AUTO_SWAP_INTERVAL = 5000

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const nextTestimonial = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  const prevTestimonial = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  const resetInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(nextTestimonial, AUTO_SWAP_INTERVAL)
  }, [nextTestimonial])

  useEffect(() => {
    intervalRef.current = setInterval(nextTestimonial, AUTO_SWAP_INTERVAL)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [nextTestimonial])

  const handlePrev = () => {
    prevTestimonial()
    resetInterval()
  }

  const handleNext = () => {
    nextTestimonial()
    resetInterval()
  }

  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
    resetInterval()
  }

  return (
    <section id="testimonials" className="py-24 md:py-32 bg-foreground text-background">
      <div className="container mx-auto px-6">
        <div
          ref={ref}
          className={cn(
            "max-w-4xl mx-auto text-center opacity-0",
            isInView && "opacity-100 animate-fade-in-up"
          )}
        >
          <span className="text-sm font-medium text-background/60 uppercase tracking-wider">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-16 text-background text-balance">
            What Our Clients Say
          </h2>

          {/* Testimonial Card */}
          <div>
            <Quote className="w-16 h-16 mx-auto mb-8 text-background/20" />

            <div className="relative min-h-[350px] md:min-h-[280px]">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.author}
                  className={cn(
                    "absolute inset-0 transition-all duration-500 px-4",
                    index === currentIndex
                      ? "opacity-100 translate-x-0 pointer-events-auto"
                      : "opacity-0 translate-x-8 pointer-events-none"
                  )}
                >
                  {/* Rating */}
                  <div className="flex justify-center gap-1 mb-6">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <blockquote className="text-lg md:text-2xl leading-relaxed mb-8 text-background/90 text-pretty">
                    {`"${testimonial.quote}"`}
                  </blockquote>

                  <div className="flex items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-background/10 flex items-center justify-center shrink-0">
                      <span className="text-lg font-semibold text-background">
                        {testimonial.initials}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-background">{testimonial.author}</div>
                      <div className="text-sm text-background/60">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-12">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-background/20 text-background hover:bg-background/10 bg-transparent"
                onClick={handlePrev}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDotClick(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentIndex ? "bg-background w-8" : "bg-background/30"
                    )}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-background/20 text-background hover:bg-background/10 bg-transparent"
                onClick={handleNext}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
