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

const jobs: Job[] = [
  {
    id: "1",
    slug: "senior-fullstack-developer",
    title: "Senior Fullstack Developer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "We're looking for a Senior Fullstack Developer to join our team and help build innovative web applications. You'll work closely with our design and product teams to deliver high-quality solutions for our clients.",
    requirements: [
      "5+ years of experience with React, Next.js, and TypeScript",
      "Strong understanding of Node.js and REST/GraphQL APIs",
      "Experience with cloud platforms (AWS, GCP, or Azure)",
      "Excellent problem-solving and communication skills",
      "Experience with agile development methodologies",
    ],
    responsibilities: [
      "Design and implement scalable web applications",
      "Collaborate with cross-functional teams to define and ship new features",
      "Write clean, maintainable, and well-tested code",
      "Mentor junior developers and conduct code reviews",
      "Contribute to architectural decisions and technical planning",
    ],
    benefits: [
      "Competitive salary and equity",
      "Flexible remote work",
      "Health, dental, and vision insurance",
      "Professional development budget",
      "Unlimited PTO",
    ],
    postedDate: "2026-01-15",
  },
  {
    id: "2",
    slug: "ui-ux-designer",
    title: "UI/UX Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description:
      "Join our design team to create beautiful, user-centered experiences for our clients. You'll be responsible for the entire design process from research to final implementation.",
    requirements: [
      "3+ years of experience in UI/UX design",
      "Proficiency in Figma and design systems",
      "Strong portfolio demonstrating user-centered design process",
      "Experience with user research and usability testing",
      "Understanding of front-end development principles",
    ],
    responsibilities: [
      "Create wireframes, prototypes, and high-fidelity designs",
      "Conduct user research and translate insights into design decisions",
      "Build and maintain design systems",
      "Collaborate with developers to ensure design implementation quality",
      "Present design concepts to stakeholders and iterate based on feedback",
    ],
    benefits: [
      "Competitive salary and equity",
      "Flexible remote work",
      "Health, dental, and vision insurance",
      "Professional development budget",
      "Unlimited PTO",
    ],
    postedDate: "2026-01-20",
  },
  {
    id: "3",
    slug: "devops-engineer",
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "We're seeking a DevOps Engineer to help us build and maintain our cloud infrastructure. You'll work on automating deployments, improving system reliability, and scaling our services.",
    requirements: [
      "4+ years of experience in DevOps or Site Reliability Engineering",
      "Strong experience with AWS or GCP",
      "Proficiency with Docker, Kubernetes, and CI/CD pipelines",
      "Experience with Infrastructure as Code (Terraform, Pulumi)",
      "Strong scripting skills (Python, Bash)",
    ],
    responsibilities: [
      "Design and implement CI/CD pipelines",
      "Manage and optimize cloud infrastructure",
      "Implement monitoring, logging, and alerting solutions",
      "Ensure system security and compliance",
      "Collaborate with development teams to improve deployment processes",
    ],
    benefits: [
      "Competitive salary and equity",
      "Flexible remote work",
      "Health, dental, and vision insurance",
      "Professional development budget",
      "Unlimited PTO",
    ],
    postedDate: "2026-01-25",
  },
]

// Async functions for easy CMS migration
export async function getJobs(): Promise<Job[]> {
  // In the future, this can fetch from a CMS or API
  return jobs
}

export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  // In the future, this can fetch from a CMS or API
  return jobs.find((job) => job.slug === slug)
}

export async function getJobSlugs(): Promise<string[]> {
  // Useful for static generation
  return jobs.map((job) => job.slug)
}
