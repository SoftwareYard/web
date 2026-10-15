"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { CaseStudy } from "@/lib/clients"
import { ClientCard } from "@/components/clients/client-card"

export function ClientList({ clients }: { clients: CaseStudy[] }) {
  const [activeIndustry, setActiveIndustry] = useState("All")

  const industries = ["All", ...Array.from(new Set(clients.map((c) => c.industry)))]
  const filteredClients =
    activeIndustry === "All"
      ? clients
      : clients.filter((c) => c.industry === activeIndustry)

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-12">
        {industries.map((industry) => (
          <button
            key={industry}
            type="button"
            onClick={() => setActiveIndustry(industry)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full transition-all",
              activeIndustry === industry
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {industry}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client, index) => (
          <ClientCard key={client.slug} client={client} index={index} />
        ))}
      </div>
    </>
  )
}
