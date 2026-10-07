import { prisma } from "./prisma";

const ROLE_KEYWORDS: Record<string, string[]> = {
  FullStack: ["fullstack", "full-stack", "full stack"],
  BackEnd: ["backend", "back-end", "back end"],
  "Mobile Developer": ["mobile", "ios", "android", "flutter", "react native", "react-native"],
  FrontEnd: ["frontend", "front-end", "front end", "ui", "ux", "designer"],
  DevOPS: ["devops", "dev-ops", "sre", "infrastructure", "platform"],
  QA: ["qa", "quality", "test", "tester"],
  PM: ["project manager", "product manager", "pm", "scrum"],
};

// Match whole words only, so "pm" doesn't match "Development"
function matchesWord(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(text);
}

interface RoleMatch {
  id: string | null;
  name: string;
}

export async function mapJobTitleToRole(
  jobTitle: string
): Promise<RoleMatch> {
  for (const [roleName, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some((kw) => matchesWord(jobTitle, kw))) {
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
