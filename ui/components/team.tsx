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
      next: { revalidate: process.env.NODE_ENV === "development" ? 0 : 60 },
    })
    if (!res.ok) {
      console.error(`getTeam: ${API_URL}/api/team responded ${res.status}`)
      return []
    }
    return res.json()
  } catch (err) {
    console.error(`getTeam: fetch to ${API_URL}/api/team failed`, err)
    return []
  }
}

export async function TeamSection() {
  const team = await getTeam()
  return <TeamSectionClient team={team} />
}
