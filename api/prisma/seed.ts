import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed admin user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASS, 12);
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Admin",
    },
  });
  console.log("Admin user created (admin / changeme123)");

  // Seed team members
  const teamMembers = [
    {
      name: "Sarah Chen",
      role: "CEO & Founder",
      image: "/team/sarah-chen.jpg",
      bio: "15+ years in tech leadership. Previously at Google and Microsoft.",
      email: "sarah@softwareyard.co",
      linkedin: "#",
      twitter: "#",
      sortOrder: 0,
    },
    {
      name: "Marcus Johnson",
      role: "CTO",
      image: "/team/marcus.jpg",
      bio: "Full-stack architect with expertise in cloud infrastructure.",
      email: "marcus@softwareyard.co",
      linkedin: "#",
      twitter: "#",
      github: "#",
      sortOrder: 1,
    },
    {
      name: "Elena Rodriguez",
      role: "Head of Design",
      image: "/team/elena.jpg",
      bio: "Award-winning designer focused on user-centered experiences.",
      email: "elena@softwareyard.co",
      linkedin: "#",
      twitter: "#",
      sortOrder: 2,
    },
    {
      name: "David Kim",
      role: "Lead Developer",
      image: "/team/david.jpg",
      bio: "Expert in React, Node.js, and modern web technologies.",
      email: "david@softwareyard.co",
      linkedin: "#",
      github: "#",
      sortOrder: 3,
    },
    {
      name: "Priya Patel",
      role: "Project Manager",
      image: "/team/priya.jpg",
      bio: "Agile certified PM with 10+ years delivering complex projects.",
      email: "priya@softwareyard.co",
      linkedin: "#",
      twitter: "#",
      sortOrder: 4,
    },
    {
      name: "James Wilson",
      role: "DevOps Engineer",
      image: "/team/james.jpg",
      bio: "Kubernetes and AWS specialist. Automation enthusiast.",
      email: "james@softwareyard.co",
      linkedin: "#",
      github: "#",
      sortOrder: 5,
    },
  ];

  const existingTeam = await prisma.teamMember.count();
  if (existingTeam === 0) {
    for (const member of teamMembers) {
      await prisma.teamMember.create({ data: member });
    }
    console.log(`Seeded ${teamMembers.length} team members`);
  } else {
    console.log("Team members already exist, skipping");
  }

  // Seed jobs
  const jobs = [
    {
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
      postedDate: new Date("2026-01-15"),
    },
    {
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
      postedDate: new Date("2026-01-20"),
    },
    {
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
      postedDate: new Date("2026-01-25"),
    },
  ];

  const existingJobs = await prisma.job.count();
  if (existingJobs === 0) {
    for (const job of jobs) {
      await prisma.job.create({ data: job });
    }
    console.log(`Seeded ${jobs.length} jobs`);
  } else {
    console.log("Jobs already exist, skipping");
  }

  console.log("Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
