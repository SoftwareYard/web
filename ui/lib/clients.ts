export interface CaseStudyStep {
  title: string
  description: string
  image?: string | null
}

export interface CaseStudyStat {
  value: string
  label: string
}

export interface CaseStudy {
  id: string
  slug: string
  name: string
  industry: string
  location: string
  headline: string
  summary: string
  services: string[]
  technologies: string[]
  color: string
  logoImage: string | null
  coverImage: string | null
  challengeImage: string | null
  outcomeImage: string | null
  stats: CaseStudyStat[]
  challenge: string
  steps: CaseStudyStep[]
  outcome: string
  testimonialQuote: string | null
  testimonialAuthor: string | null
  testimonialRole: string | null
  sortOrder: number
  isActive: boolean
}

// Tailwind classes must appear literally in source to be generated, so the
// admin picks from this list rather than typing arbitrary classes.
export const caseStudyColors = [
  { label: "Emerald", value: "from-emerald-500/20 to-teal-500/20" },
  { label: "Blue", value: "from-blue-500/20 to-indigo-500/20" },
  { label: "Orange", value: "from-orange-500/20 to-red-500/20" },
  { label: "Pink", value: "from-pink-500/20 to-rose-500/20" },
  { label: "Violet", value: "from-violet-500/20 to-purple-500/20" },
  { label: "Cyan", value: "from-cyan-500/20 to-sky-500/20" },
  { label: "Amber", value: "from-amber-500/20 to-yellow-500/20" },
  { label: "Slate", value: "from-slate-500/20 to-zinc-500/20" },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function getClients(): Promise<CaseStudy[]> {
  try {
    const res = await fetch(`${API_URL}/api/case-studies`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getClientBySlug(slug: string): Promise<CaseStudy | undefined> {
  try {
    const res = await fetch(`${API_URL}/api/case-studies/by-slug/${slug}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return undefined
    return res.json()
  } catch {
    return undefined
  }
}

export async function getClientSlugs(): Promise<string[]> {
  const clients = await getClients()
  return clients.map((client) => client.slug)
}
