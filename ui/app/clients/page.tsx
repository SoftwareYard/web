import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getClients } from "@/lib/clients"
import { ClientList } from "@/components/clients/client-list"

export const metadata: Metadata = {
  title: "Clients & Case Studies - SoftwareYard",
  description:
    "See how SoftwareYard helps companies build, scale and maintain software. Explore our clients and the work we did together.",
}

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="container mx-auto px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="max-w-3xl">
            <span className="text-sm font-medium text-accent uppercase tracking-wider">
              Our Clients
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6 text-balance">
              Work we&apos;re proud of
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty">
              From startups to established businesses, we partner with companies to
              design, build and scale software. Explore the clients we work with and
              how we helped them reach their goals.
            </p>
          </div>
        </div>
      </section>

      {/* Client Listing Section */}
      <section className="pb-24 md:pb-32">
        <div className="container mx-auto px-6">
          {clients.length > 0 ? (
            <ClientList clients={clients} />
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                Case studies are coming soon. Check back shortly!
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
