interface FaqRule {
  keywords: string[]
  answer: string
}

const FAQ_RULES: FaqRule[] = [
  {
    keywords: ["hello", "hi", "hey", "greetings"],
    answer: "Hi there! 👋 I can help with quick questions about our services, pricing, location, or how to get in touch. What would you like to know?",
  },
  {
    keywords: ["service", "services", "offer", "offers", "what do you do", "capabilities"],
    answer:
      "We offer Digital Transformation, Dedicated Resources, Recruitment, App & Data Integration, Quality Assurance, App Development, Product Development, Cloud Solutions, Data Entry, and Customer Support. Want details on any of these?",
  },
  {
    keywords: ["recruit", "recruits", "recruiting", "recruitment", "recruiter", "hiring service", "staffing", "talent"],
    answer:
      "We handle recruitment end-to-end — sourcing, screening, and placing skilled tech talent for your team. Reach out at contact@softwareyard.co and tell us what roles you're looking to fill.",
  },
  {
    keywords: ["price", "prices", "pricing", "cost", "costs", "how much", "quote", "budget"],
    answer:
      "Pricing depends on the scope of your project. Send us a few details via the contact form or contact@softwareyard.co and we'll get back to you with a tailored quote.",
  },
  {
    keywords: ["contact", "email", "reach", "get in touch", "talk to"],
    answer: "You can reach us at contact@softwareyard.co, or use the contact form further down this page.",
  },
  {
    keywords: ["location", "where", "based", "office", "address"],
    answer: "We're based in Bitola, North Macedonia.",
  },
  {
    keywords: ["hour", "hours", "open", "available", "time zone", "timezone"],
    answer: "Our hours are Monday - Friday, 10:00 - 18:00 CET.",
  },
  {
    keywords: [
      "career", "careers", "job", "jobs", "hiring", "vacancy", "vacancies",
      "position", "positions", "apply", "applying", "work for you", "join", "joining",
    ],
    answer: "We're always open to great people! Check our current openings on the Careers page.",
  },
  {
    keywords: ["team", "who are you", "about", "company"],
    answer:
      "SoftwareYard is a software development company that helps businesses transform their ideas into scalable, user-friendly applications.",
  },
  {
    keywords: ["thank", "thanks", "cheers"],
    answer: "You're welcome! Let us know if there's anything else you'd like to know.",
  },
  {
    keywords: ["bye", "goodbye", "see you"],
    answer: "Thanks for stopping by! Feel free to reach out any time at contact@softwareyard.co.",
  },
]

const FALLBACK_ANSWER =
  "I'm not sure about that one. For anything specific, drop us a line at contact@softwareyard.co and we'll get back to you personally."

function containsKeyword(message: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`\\b${escaped}\\b`).test(message)
}

export interface FaqAnswer {
  answer: string
  matched: boolean
}

export function getFaqAnswer(message: string): FaqAnswer {
  const normalized = message.toLowerCase()
  const rule = FAQ_RULES.find((r) =>
    r.keywords.some((keyword) => containsKeyword(normalized, keyword))
  )
  return rule ? { answer: rule.answer, matched: true } : { answer: FALLBACK_ANSWER, matched: false }
}
