import type { CaseStudy } from "../generated/prisma/client";

const REPLACEMENT = "the client";

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Replaces whole-word mentions of the client name (any case, with or without
// a possessive 's) with "the client", capitalised at the start of a sentence.
export function removeClientName(text: string, name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return text;
  // Word boundaries that also work for names starting/ending with symbols
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])(${escapeRegExp(trimmed)})(?![\\p{L}\\p{N}])`,
    "giu"
  );
  return text.replace(pattern, (_match, before: string, _name: string, offset: number) => {
    const preceding = text.slice(0, offset + before.length);
    const sentenceStart = /(^\s*["“]?|[.!?]\s+["“]?|\n\s*["“]?)$/u.test(preceding);
    const replacement = sentenceStart
      ? REPLACEMENT[0].toUpperCase() + REPLACEMENT.slice(1)
      : REPLACEMENT;
    return before + replacement;
  });
}

// Public view of a case study whose client must not be named: the real name
// and logo never leave the API, so they can't show up in the page source.
export function toPublicCaseStudy(caseStudy: CaseStudy) {
  if (caseStudy.showClient) return caseStudy;

  const strip = (text: string) => removeClientName(text, caseStudy.name);
  const stripOptional = (text: string | null) => (text ? strip(text) : text);
  const steps = Array.isArray(caseStudy.steps)
    ? (caseStudy.steps as { title?: string; description?: string }[]).map((step) => ({
        ...step,
        title: step.title ? strip(step.title) : step.title,
        description: step.description ? strip(step.description) : step.description,
      }))
    : caseStudy.steps;
  const stats = Array.isArray(caseStudy.stats)
    ? (caseStudy.stats as { value?: string; label?: string }[]).map((stat) => ({
        ...stat,
        value: stat.value ? strip(stat.value) : stat.value,
        label: stat.label ? strip(stat.label) : stat.label,
      }))
    : caseStudy.stats;

  return {
    ...caseStudy,
    name: caseStudy.anonymousName || "Confidential client",
    anonymousName: null,
    logoImage: null,
    logoOnDark: false,
    headline: strip(caseStudy.headline),
    summary: strip(caseStudy.summary),
    challenge: strip(caseStudy.challenge),
    outcome: strip(caseStudy.outcome),
    services: caseStudy.services.map(strip),
    technologies: caseStudy.technologies.map(strip),
    stats,
    steps,
    testimonialQuote: stripOptional(caseStudy.testimonialQuote),
    // A named person identifies the company
    testimonialAuthor: null,
    testimonialRole: stripOptional(caseStudy.testimonialRole),
  };
}
