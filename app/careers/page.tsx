import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getJobs } from "@/lib/jobs"
import { JobCard } from "@/components/careers/job-card"

export const metadata: Metadata = {
  title: "Careers - SoftwareYard",
  description:
    "Join our team and help build innovative software solutions. Explore open positions at SoftwareYard.",
}

export default async function CareersPage() {
  const jobs = await getJobs()

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
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
              Careers
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6 text-balance">
              Join Our Team
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty">
              We&apos;re always looking for talented individuals who are passionate
              about building great software. Check out our open positions and find
              your next opportunity.
            </p>
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="pb-24 md:pb-32">
        <div className="container mx-auto px-6">
          {jobs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job, index) => (
                <JobCard key={job.id} job={job} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                No open positions at the moment. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
