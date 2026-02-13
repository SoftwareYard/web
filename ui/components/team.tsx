import { TeamSectionClient } from "./team-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface TeamMember {
  id: string
  name: string
  role: string
  image: string
  bio: string
  email?: string | null
  linkedin?: string | null
  twitter?: string | null
  github?: string | null
}

async function getTeam(): Promise<TeamMember[]> {
  try {
    const res = await fetch(`${API_URL}/api/team`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function TeamSection() {
  const team = await getTeam()
  return <TeamSectionClient team={team} />
}
