import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MapPin, Briefcase, Calendar, Building2 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getJobBySlug, getJobSlugs } from "@/lib/jobs"
import { ApplyForm } from "@/components/careers/apply-form"

interface JobPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getJobSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: JobPageProps): Promise<Metadata> {
  const { slug } = await params
  const job = await getJobBySlug(slug)

  if (!job) {
    return {
      title: "Job Not Found - SoftwareYard",
    }
  }

  return {
    title: `${job.title} - Careers at SoftwareYard`,
    description: job.description,
  }
}

export default async function JobPage({ params }: JobPageProps) {
  const { slug } = await params
  const job = await getJobBySlug(slug)

  if (!job) {
    notFound()
  }

  const formattedDate = new Date(job.postedDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-secondary/30">
        <div className="container mx-auto px-6">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Jobs
          </Link>

          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full mb-4">
              {job.type}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{job.title}</h1>

            <div className="flex flex-wrap gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {job.department}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {job.location}
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                {job.type}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Posted {formattedDate}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Details Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Description */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">About the Role</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {job.description}
                </p>
              </div>

              {/* Responsibilities */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Responsibilities</h2>
                <ul className="space-y-3">
                  {job.responsibilities.map((item, index) => (
                    <li key={index} className="flex gap-3 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Requirements</h2>
                <ul className="space-y-3">
                  {job.requirements.map((item, index) => (
                    <li key={index} className="flex gap-3 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Benefits</h2>
                <ul className="space-y-3">
                  {job.benefits.map((item, index) => (
                    <li key={index} className="flex gap-3 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar - Apply Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <ApplyForm jobTitle={job.title} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
