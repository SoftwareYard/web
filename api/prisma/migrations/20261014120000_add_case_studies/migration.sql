-- CreateTable
CREATE TABLE "case_studies" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "color" TEXT NOT NULL,
    "stats" JSONB NOT NULL DEFAULT '[]',
    "challenge" TEXT NOT NULL,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "outcome" TEXT NOT NULL,
    "testimonial_quote" TEXT,
    "testimonial_author" TEXT,
    "testimonial_role" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_studies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "case_studies_slug_key" ON "case_studies"("slug");


-- Seed initial case studies (previously hardcoded in ui/lib/clients.ts)
INSERT INTO "case_studies" ("id", "slug", "name", "industry", "location", "headline", "summary", "services", "technologies", "color", "stats", "challenge", "steps", "outcome", "testimonial_quote", "testimonial_author", "testimonial_role", "sort_order", "updated_at") VALUES (
  'seed_case_study_vpar', 'vpar', 'VPAR', 'Sports & Leisure', 'United Kingdom',
  'Scaling a golf platform used by clubs worldwide',
  'Dedicated engineers extending VPAR''s golf scoring and tournament management platform across web and mobile.',
  ARRAY['Team Augmentation', 'Web Development', 'Mobile Development']::TEXT[],
  ARRAY['.NET', 'React', 'React Native', 'SQL Server', 'Azure']::TEXT[],
  'from-emerald-500/20 to-teal-500/20',
  '[{"value":"5+","label":"Years of partnership"},{"value":"Web & Mobile","label":"Platforms delivered"},{"value":"Worldwide","label":"Clubs served"}]'::jsonb,
  'VPAR needed to grow its engineering capacity quickly to keep up with a fast-moving product roadmap, without compromising on quality or blowing the budget on expensive local hires.',
  '[{"title":"Discovery & onboarding","description":"We embedded with VPAR''s in-house team, learned the domain and existing codebase, and aligned on processes, tooling and release cadence."},{"title":"Building a dedicated team","description":"We assembled engineers matched to VPAR''s stack who worked as a natural extension of their team, attending the same ceremonies and owning features end to end."},{"title":"Club platform development","description":"We built and extended club-facing modules for managing members, competitions and tournaments, with a focus on reliability during peak usage."},{"title":"Mobile experience","description":"We delivered improvements to the mobile apps golfers use on the course for live scoring and leaderboards."},{"title":"Ongoing support & evolution","description":"We continue to maintain, optimise and ship new features as the product grows into new markets."}]'::jsonb,
  'VPAR gained a reliable, cost-effective engineering team that ships features continuously and has become a long-term partner in the platform''s growth.',
  'The engineers provided by Software Yard were exactly what was required for our project and a good deal cheaper than other vendors we worked with, without compromising on quality. Very happy and will work with Software Yard again.', 'Stephen Hyland', 'Head of Technology',
  0, CURRENT_TIMESTAMP
);

INSERT INTO "case_studies" ("id", "slug", "name", "industry", "location", "headline", "summary", "services", "technologies", "color", "stats", "challenge", "steps", "outcome", "testimonial_quote", "testimonial_author", "testimonial_role", "sort_order", "updated_at") VALUES (
  'seed_case_study_vsc', 'vsc', 'VSC', 'Enterprise', 'North Macedonia',
  '20+ projects delivered as a long-term technology partner',
  'From business management systems to client-facing web apps, we''ve delivered more than 20 projects together with VSC.',
  ARRAY['Custom Software', 'Web Development', 'UI/UX Design']::TEXT[],
  ARRAY['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS']::TEXT[],
  'from-blue-500/20 to-indigo-500/20',
  '[{"value":"20+","label":"Projects delivered"},{"value":"End-to-end","label":"Design to deployment"},{"value":"Long-term","label":"Partnership"}]'::jsonb,
  'VSC needed a technology partner able to take on a steady stream of projects of different sizes for its clients, from quick prototypes to full business management systems, while keeping quality consistent.',
  '[{"title":"Requirements & scoping","description":"For each project we ran short discovery sessions to understand the business goals and turned them into a clear scope, estimate and delivery plan."},{"title":"Design & prototyping","description":"We created wireframes and interactive prototypes so stakeholders could validate the flows before development started."},{"title":"Iterative development","description":"We built each solution in short iterations with regular demos, adjusting priorities based on feedback."},{"title":"Launch & handover","description":"We deployed to the cloud, set up monitoring and handed over documentation so every project went live smoothly."}]'::jsonb,
  'A repeatable, dependable delivery process that has produced more than 20 successful projects and a partnership that keeps growing.',
  'Great cooperation, finished more than 20 projects together, and hope to continue. Innovative, consistent, and professional, you will find all within the Software Yard team, loving to work with them.', 'Nikola Maksimovski', 'Founder',
  1, CURRENT_TIMESTAMP
);

INSERT INTO "case_studies" ("id", "slug", "name", "industry", "location", "headline", "summary", "services", "technologies", "color", "stats", "challenge", "steps", "outcome", "testimonial_quote", "testimonial_author", "testimonial_role", "sort_order", "updated_at") VALUES (
  'seed_case_study_the_development_yard', 'the-development-yard', 'The Development Yard', 'Software Services', 'United Kingdom',
  'A reliable B2B engineering partner for client delivery',
  'Supporting The Development Yard with engineering capacity to deliver software projects for their own clients.',
  ARRAY['Team Augmentation', 'Custom Software', 'QA & Testing']::TEXT[],
  ARRAY['React', 'Node.js', '.NET', 'Azure']::TEXT[],
  'from-orange-500/20 to-red-500/20',
  '[{"value":"B2B","label":"Partnership model"},{"value":"Multiple","label":"Client projects"},{"value":"Flexible","label":"Team scaling"}]'::jsonb,
  'The Development Yard needed a partner that could scale up and down with their client pipeline and deliver to the same standard they promise their own customers.',
  '[{"title":"Aligning on standards","description":"We adopted The Development Yard''s coding standards, workflows and communication channels so our work was indistinguishable from theirs."},{"title":"Flexible team setup","description":"We provided engineers on demand, scaling the team up for big deliveries and down between projects."},{"title":"Delivery & quality assurance","description":"We built features, wrote tests and handled QA so releases to their clients were predictable and stable."},{"title":"Continuous collaboration","description":"We stayed involved after launch, supporting maintenance and new phases of work."}]'::jsonb,
  'The Development Yard can take on more client work with confidence, backed by a partner committed to excellence and a customer-centric approach.',
  'I wholeheartedly recommend Software Yard to any business seeking a reliable, innovative, and dedicated B2B partner. Their commitment to excellence, combined with a customer-centric approach, sets them apart in the industry.', 'Simon Carroll', 'Co-Founder',
  2, CURRENT_TIMESTAMP
);
