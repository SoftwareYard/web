export interface Job {
  id: string
  slug: string
  title: string
  department: string
  location: string
  type: "Full-time" | "Part-time" | "Contract" | "Remote"
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  postedDate: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function getJobs(): Promise<Job[]> {
  try {
    const res = await fetch(`${API_URL}/api/jobs`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  try {
    const res = await fetch(`${API_URL}/api/jobs/by-slug/${slug}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return undefined
    return res.json()
  } catch {
    return undefined
  }
}

export async function getJobSlugs(): Promise<string[]> {
  const jobs = await getJobs()
  return jobs.map((job) => job.slug)
}
