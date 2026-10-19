import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, MapPin, Building2, Quote } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { getClientBySlug, getClientSlugs, getClients } from "@/lib/clients"
import { cn } from "@/lib/utils"
import { ClientLogo } from "@/components/clients/client-logo"

interface ClientPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getClientSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: ClientPageProps): Promise<Metadata> {
  const { slug } = await params
  const client = await getClientBySlug(slug)

  if (!client) {
    return {
      title: "Client Not Found - SoftwareYard",
    }
  }

  return {
    title: `${client.name} Case Study - SoftwareYard`,
    description: client.summary,
  }
}

// The page adds its own quote marks, so drop any typed into the testimonial
function stripQuotes(text: string) {
  return text.trim().replace(/^["'“”„«»‘’]+|["'“”„«»‘’]+$/g, "").trim()
}

// Stats row keeps every item on one line on desktop, whatever the count
const statColumns: Record<number, string> = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
}

function SectionImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[16/9] mt-6 rounded-2xl overflow-hidden border border-border bg-secondary/30">
      <Image src={src} alt={alt} fill className="object-cover" />
    </div>
  )
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { slug } = await params
  const client = await getClientBySlug(slug)

  if (!client) {
    notFound()
  }

  const clients = await getClients()
  const currentIndex = clients.findIndex((c) => c.slug === client.slug)
  const nextClient = currentIndex >= 0 ? clients[(currentIndex + 1) % clients.length] : undefined
  const hasSidebar = client.services.length > 0 || client.technologies.length > 0
  const testimonialRole = client.testimonialRole ?? ""
  // Skip the client name when the role already names it ("Founder, ... (Capsa customer)")
  const testimonialCompany = testimonialRole.toLowerCase().includes(client.name.toLowerCase())
    ? ""
    : client.name

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className={cn("pt-32 pb-12 md:pt-40 md:pb-16 bg-gradient-to-br", client.color)}>
        <div className="container mx-auto px-6">
          <Link
            href="/clients"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Clients
          </Link>

          <div
            className={cn(
              client.coverImage
                ? "grid lg:grid-cols-2 gap-12 items-center"
                : "max-w-3xl"
            )}
          >
            <div>
              {client.logoImage ? (
                <ClientLogo
                  src={client.logoImage}
                  alt={client.name}
                  onDark={client.logoOnDark}
                  align="left"
                  className="h-14 w-44 mb-6"
                />
              ) : (
                <span className="inline-block px-3 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full mb-4">
                  {client.name}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
                {client.headline}
              </h1>
              <p className="text-lg text-muted-foreground mb-6 text-pretty">{client.summary}</p>

              <div className="flex flex-wrap gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {client.industry}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {client.location}
                </div>
              </div>
            </div>

            {client.coverImage && (
              <div className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-lg">
                <Image
                  src={client.coverImage}
                  alt={client.name}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      {client.stats.length > 0 && (
        <section className="border-b border-border">
          <div className="container mx-auto px-6">
            <div
              className={cn(
                "grid gap-x-8 gap-y-6 py-10",
                statColumns[client.stats.length] ?? "sm:grid-cols-2 lg:grid-cols-3"
              )}
            >
              {client.stats.map((stat, index) => (
                <div key={index} className="border-l-2 border-accent pl-5">
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Case Study Details */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className={cn("space-y-16", hasSidebar ? "lg:col-span-2" : "lg:col-span-3 max-w-3xl")}>
              {/* Challenge */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">The Challenge</h2>
                <p className="text-muted-foreground leading-relaxed">{client.challenge}</p>
                {client.challengeImage && (
                  <SectionImage src={client.challengeImage} alt="The challenge" />
                )}
              </div>

              {/* Steps */}
              <div>
                <h2 className="text-2xl font-semibold mb-8">What We Did</h2>
                <ol className="relative">
                  {client.steps.map((step, index) => (
                    <li key={step.title} className="relative flex gap-6 pb-10 last:pb-0">
                      {index < client.steps.length - 1 && (
                        <span className="absolute left-5 top-12 bottom-0 w-px bg-border" />
                      )}
                      <span className="relative z-10 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-semibold flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="pt-1.5">
                        <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                        {step.image && <SectionImage src={step.image} alt={step.title} />}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Outcome */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">The Outcome</h2>
                <p className="text-muted-foreground leading-relaxed">{client.outcome}</p>
                {client.outcomeImage && (
                  <SectionImage src={client.outcomeImage} alt="The outcome" />
                )}
              </div>
            </div>

            {/* Sidebar */}
            {hasSidebar && (
              <div className="lg:col-span-1">
                <div className="sticky top-32 space-y-6">
                  {client.services.length > 0 && (
                    <div className="p-6 rounded-3xl border border-border bg-card">
                      <h3 className="font-semibold mb-4">Services</h3>
                      <div className="flex flex-wrap gap-2">
                        {client.services.map((service) => (
                          <span
                            key={service}
                            className="px-3 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {client.technologies.length > 0 && (
                    <div className="p-6 rounded-3xl border border-border bg-card">
                      <h3 className="font-semibold mb-4">Technologies</h3>
                      <div className="flex flex-wrap gap-2">
                        {client.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1 text-xs font-medium bg-secondary rounded-full"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      {client.testimonialQuote && (
        <section className="py-20 md:py-24 bg-foreground text-background">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <Quote className="w-12 h-12 mx-auto mb-8 text-background/20" />
              <blockquote className="text-xl md:text-2xl font-medium leading-relaxed mb-8 text-pretty">
                &ldquo;{stripQuotes(client.testimonialQuote)}&rdquo;
              </blockquote>
              {client.testimonialAuthor && (
                <div className="font-semibold">{client.testimonialAuthor}</div>
              )}
              <div className="text-background/60 text-sm">
                {[testimonialRole, testimonialCompany].filter(Boolean).join(", ")}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA + Next Client */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 md:p-10 rounded-3xl bg-secondary/50 border border-border">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Have a similar project?</h2>
              <p className="text-muted-foreground mb-6">
                Tell us about your goals and we&apos;ll show you how we can help.
              </p>
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/#contact">Get in touch</Link>
              </Button>
            </div>

            {nextClient && nextClient.slug !== client.slug && (
              <Link
                href={`/clients/${nextClient.slug}`}
                className={cn(
                  "group p-8 md:p-10 rounded-3xl border border-border bg-gradient-to-br flex flex-col justify-between",
                  nextClient.color
                )}
              >
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Next case study
                </span>
                <div className="mt-6">
                  <div className="text-sm text-muted-foreground mb-2">{nextClient.name}</div>
                  <div className="flex items-end justify-between gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold group-hover:text-accent transition-colors">
                      {nextClient.headline}
                    </h2>
                    <ArrowRight className="w-6 h-6 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
