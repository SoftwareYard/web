import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { uploadToBunny, deleteFromBunny } from "../lib/bunny";

export const caseStudiesRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

type CaseStudyImages = {
  logoImage: string | null;
  coverImage: string | null;
  challengeImage: string | null;
  outcomeImage: string | null;
  steps: unknown;
};

function imageUrls(caseStudy: CaseStudyImages): string[] {
  const stepImages = Array.isArray(caseStudy.steps)
    ? caseStudy.steps.map((step: { image?: string | null }) => step?.image)
    : [];
  return [
    caseStudy.logoImage,
    caseStudy.coverImage,
    caseStudy.challengeImage,
    caseStudy.outcomeImage,
    ...stepImages,
  ].filter((url): url is string => !!url);
}

// Remove CDN files that are no longer referenced; failures are not fatal
async function deleteImages(urls: string[]) {
  await Promise.all(urls.map((url) => deleteFromBunny(url).catch(() => {})));
}

function isSlugTaken(err: unknown) {
  return (err as { code?: string })?.code === "P2002";
}

// Trim text so stray spaces from pasted content don't create duplicate
// industry filters or blank entries on the website
const text = (value: unknown) =>
  (typeof value === "string" ? value.trim() : value) as string;
const optionalText = (value: unknown) => (typeof value === "string" && value.trim()) || null;
const textList = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];

function toData(body: Request["body"]) {
  const {
    slug,
    name,
    industry,
    location,
    headline,
    summary,
    services,
    technologies,
    color,
    logoImage,
    logoOnDark,
    coverImage,
    challengeImage,
    outcomeImage,
    stats,
    challenge,
    steps,
    outcome,
    testimonialQuote,
    testimonialAuthor,
    testimonialRole,
    sortOrder,
    isActive,
  } = body;
  return {
    slug: text(slug),
    name: text(name),
    industry: text(industry),
    location: text(location),
    headline: text(headline),
    summary: text(summary),
    services: textList(services),
    technologies: textList(technologies),
    color,
    logoImage: logoImage || null,
    logoOnDark: !!logoOnDark,
    coverImage: coverImage || null,
    challengeImage: challengeImage || null,
    outcomeImage: outcomeImage || null,
    stats: Array.isArray(stats)
      ? stats
          .map((stat) => ({ value: text(stat?.value), label: text(stat?.label) }))
          .filter((stat) => stat.value)
      : [],
    challenge: text(challenge),
    steps: Array.isArray(steps)
      ? steps
          .map((step) => ({
            title: text(step?.title),
            description: text(step?.description),
            image: step?.image || null,
          }))
          .filter((step) => step.title)
      : [],
    outcome: text(outcome),
    testimonialQuote: optionalText(testimonialQuote),
    testimonialAuthor: optionalText(testimonialAuthor),
    testimonialRole: optionalText(testimonialRole),
    sortOrder: sortOrder ?? 0,
    isActive: isActive ?? true,
  };
}

// PUBLIC: Get all case studies (active only by default, all if ?all=true)
caseStudiesRouter.get("/", async (req: Request, res: Response) => {
  const showAll = req.query.all === "true";
  const caseStudies = await prisma.caseStudy.findMany({
    where: showAll ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  res.json(caseStudies);
});

// PUBLIC: Get single case study by slug
caseStudiesRouter.get("/by-slug/:slug", async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const caseStudy = await prisma.caseStudy.findFirst({
    where: { slug, isActive: true },
  });
  if (!caseStudy) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(caseStudy);
});

// PROTECTED: Upload a section image, returns its CDN url (saved with the case study)
caseStudiesRouter.post(
  "/images",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "Image file is required" });
      return;
    }
    try {
      const url = await uploadToBunny(req.file.buffer, req.file.originalname, "CaseStudies");
      res.status(201).json({ url });
    } catch {
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// PROTECTED: Create case study
caseStudiesRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const caseStudy = await prisma.caseStudy.create({ data: toData(req.body) });
    res.status(201).json(caseStudy);
  } catch (err) {
    if (isSlugTaken(err)) {
      res.status(409).json({ error: "A case study with this slug already exists" });
      return;
    }
    throw err;
  }
});

// PROTECTED: Update case study
caseStudiesRouter.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const existing = await prisma.caseStudy.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  try {
    const caseStudy = await prisma.caseStudy.update({
      where: { id },
      data: toData(req.body),
    });
    const kept = new Set(imageUrls(caseStudy));
    await deleteImages(imageUrls(existing).filter((url) => !kept.has(url)));
    res.json(caseStudy);
  } catch (err) {
    if (isSlugTaken(err)) {
      res.status(409).json({ error: "A case study with this slug already exists" });
      return;
    }
    throw err;
  }
});

// PROTECTED: Delete case study
caseStudiesRouter.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const caseStudy = await prisma.caseStudy.delete({ where: { id } });
  await deleteImages(imageUrls(caseStudy));
  res.json({ success: true });
});
