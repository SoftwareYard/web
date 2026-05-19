import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { LogosSection } from "@/components/logos"
import { ServicesSection } from "@/components/services"
import { AboutSection } from "@/components/about"
import { ProcessSection } from "@/components/process"
import { WhatWeEngineerSection } from "@/components/what-we-engineer"
import { TeamSection } from "@/components/team"
import { TestimonialsSection } from "@/components/testimonials"
import { CTASection } from "@/components/cta"
import { ContactSection } from "@/components/contact"
import { Footer } from "@/components/footer"

export default async function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <LogosSection />
      <ServicesSection />
      <AboutSection />
      <ProcessSection />
      <WhatWeEngineerSection />
      <TeamSection />
      <TestimonialsSection />
      <CTASection />
      <ContactSection />
      <Footer />
    </main>
  )
}
