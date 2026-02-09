"use client"

import React from "react"

import { useRef, useState } from "react"
import { Mail, MapPin, Clock, Send, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "contact@softwareyard.co",
    href: "mailto:contact@softwareyard.co",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Bitola, North Macedonia",
    href: null,
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon - Fri, 10:00 - 18:00 CET",
    href: null,
  },
]

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <section id="contact" className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div
          ref={ref}
          className={cn(
            "grid lg:grid-cols-2 gap-16 opacity-0",
            isInView && "opacity-100"
          )}
        >
          {/* Left Column - Info */}
          <div className={cn("opacity-0", isInView && "animate-slide-in-left")}>
            <span className="text-sm font-medium text-accent uppercase tracking-wider">
              Contact Us
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 text-balance">
              Let&apos;s Start a Project Together
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Have a project in mind? We&apos;d love to hear about it. Send us a message
              and we&apos;ll get back to you as soon as possible.
            </p>

            <div className="space-y-6">
              {contactInfo.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-4 opacity-0",
                    isInView && "animate-fade-in-up"
                  )}
                  style={{ animationDelay: `${200 + index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="font-medium hover:text-accent transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <div className="font-medium">{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div className="flex gap-4 mt-10">
              {["LinkedIn", "Facebook", "Instagram"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="px-4 py-2 text-sm font-medium bg-secondary rounded-full hover:bg-foreground hover:text-background transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {/* Right Column - Form */}
          <div
            className={cn("opacity-0", isInView && "animate-slide-in-right animation-delay-100")}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-card border border-border rounded-3xl p-8 md:p-10"
            >
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium mb-2"
                  >
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="rounded-xl h-12"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium mb-2"
                  >
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    className="rounded-xl h-12"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="rounded-xl h-12"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="company" className="block text-sm font-medium mb-2">
                  Company (Optional)
                </label>
                <Input
                  id="company"
                  placeholder="Your Company"
                  className="rounded-xl h-12"
                />
              </div>

              <div className="mb-8">
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your project..."
                  rows={5}
                  className="rounded-xl resize-none"
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full gap-2"
                disabled={submitted}
              >
                {submitted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Message Sent!
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
