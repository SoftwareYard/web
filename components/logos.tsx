"use client"

const logos = [
  "VPAR",
  "VSC",
  "DevYard",
  "TechFlow",
  "DataSync",
  "CloudNine",
  "InnovateTech",
  "DigitalEdge",
]

export function LogosSection() {
  return (
    <section className="py-16 border-y border-border bg-secondary/30">
      <div className="container mx-auto px-6">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by innovative companies worldwide
        </p>

        <div className="relative overflow-hidden">
          <div className="flex animate-marquee">
            {[...logos, ...logos].map((logo, index) => (
              <div
                key={`${logo}-${index}`}
                className="flex-shrink-0 mx-12 flex items-center justify-center"
              >
                <span className="text-2xl font-bold text-muted-foreground/50 hover:text-foreground transition-colors">
                  {logo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
