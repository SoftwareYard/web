import { prisma } from "./prisma";

const ROLE_KEYWORDS: Record<string, string[]> = {
  FullStack: ["fullstack", "full-stack", "full stack"],
  FrontEnd: ["frontend", "front-end", "front end", "ui", "ux", "designer"],
  DevOPS: ["devops", "dev-ops", "sre", "infrastructure", "platform"],
  QA: ["qa", "quality", "test", "tester"],
  PM: ["project manager", "product manager", "pm", "scrum"],
};

interface RoleMatch {
  id: string | null;
  name: string;
}

export async function mapJobTitleToRole(
  jobTitle: string
): Promise<RoleMatch> {
  const lower = jobTitle.toLowerCase();

  for (const [roleName, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      const role = await prisma.candidateRole.findUnique({
        where: { name: roleName },
      });
      return { id: role?.id ?? null, name: roleName };
    }
  }

  const other = await prisma.candidateRole.findUnique({
    where: { name: "OTHER" },
  });
  return { id: other?.id ?? null, name: "OTHER" };
}
