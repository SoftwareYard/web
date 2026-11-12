import { Router, Request, Response } from "express";
import { Resend } from "resend";
import multer from "multer";
import { uploadToBunny } from "../lib/bunny";
import { mapJobTitleToRole } from "../lib/role-mapper";
import { prisma } from "../lib/prisma";
import { escapeSlack, sendSlackMessage } from "../lib/slack";
import { WEBSITE_SENDER, CAREERS_SENDER, escapeHtml, escapeMultiline } from "../lib/email";
import { applicationSalaryFromNetEur } from "../services/salary.calculator.service";

const resend = new Resend(process.env.RESEND_API_KEY);
export const applyRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

type ApplicationNotification = {
  applicationId: string | null;
  position: string;
  fullName: string;
  email: string;
  phone: string;
  expectedSalary: string;
  linkedin?: string;
  github?: string;
  coverLetter?: string;
  cvLink: string;
  cvFile: Express.Multer.File;
};

// Recruitment team email; links the CV, or attaches it only when the upload failed
// (attachments push mail into spam)
async function sendTeamEmail(a: ApplicationNotification) {
  const cvHtml = a.cvLink
    ? `<a href="${escapeHtml(a.cvLink)}">${escapeHtml(a.cvFile.originalname)}</a>`
    : "Attached";

  const { error } = await resend.emails.send({
    from: WEBSITE_SENDER,
    to: "careers@softwareyard.co",
    replyTo: a.email,
    subject: `${a.position} - ${a.fullName}`,
    html: `
      <h2>New Job Application</h2>
      <p><strong>Position:</strong> ${escapeHtml(a.position)}</p>
      <p><strong>Name:</strong> ${escapeHtml(a.fullName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(a.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(a.phone)}</p>
      <p><strong>Expected Salary:</strong> ${escapeHtml(a.expectedSalary)}</p>
      <p><strong>LinkedIn:</strong> ${escapeHtml(a.linkedin || "N/A")}</p>
      <p><strong>GitHub:</strong> ${escapeHtml(a.github || "N/A")}</p>
      <p><strong>CV:</strong> ${cvHtml}</p>
      <hr />
      <p><strong>Cover Letter:</strong></p>
      <p>${escapeMultiline(a.coverLetter || "N/A")}</p>
    `,
    text: [
      "New Job Application",
      "",
      `Position: ${a.position}`,
      `Name: ${a.fullName}`,
      `Email: ${a.email}`,
      `Phone: ${a.phone}`,
      `Expected Salary: ${a.expectedSalary}`,
      `LinkedIn: ${a.linkedin || "N/A"}`,
      `GitHub: ${a.github || "N/A"}`,
      `CV: ${a.cvLink || "Attached"}`,
      "",
      "Cover Letter:",
      a.coverLetter || "N/A",
    ].join("\n"),
    attachments: a.cvLink
      ? undefined
      : [{ filename: a.cvFile.originalname, content: a.cvFile.buffer }],
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

async function sendApplicantConfirmation(a: ApplicationNotification) {
  const firstName = String(a.fullName).trim().split(/\s+/)[0];
  const { error } = await resend.emails.send({
    from: CAREERS_SENDER,
    to: a.email,
    replyTo: "careers@softwareyard.co",
    subject: `Thank you for applying for ${a.position}`,
    html: `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Thank you for applying for the <strong>${escapeHtml(a.position)}</strong> position at SoftwareYard.</p>
      <p>We have received your application and our team will review it carefully. If your profile is a good fit for the role, we will get back to you with the next steps.</p>
      <p>Best regards,<br />SoftwareYard Team</p>
    `,
    text: [
      `Hi ${firstName},`,
      "",
      `Thank you for applying for the ${a.position} position at SoftwareYard.`,
      "",
      "We have received your application and our team will review it carefully. If your profile is a good fit for the role, we will get back to you with the next steps.",
      "",
      "Best regards,",
      "SoftwareYard Team",
    ].join("\n"),
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

async function notifyNewApplication(a: ApplicationNotification) {
  const earlier = await prisma.jobApplication.count({
    where: {
      email: { equals: String(a.email).trim(), mode: "insensitive" },
      ...(a.applicationId ? { id: { not: a.applicationId } } : {}),
    },
  });

  const cmsLink =
    a.applicationId && process.env.CORS_ORIGIN
      ? `${process.env.CORS_ORIGIN}/ctrl/applications/${a.applicationId}`
      : null;
  const links = [
    ...(cmsLink ? [`<${cmsLink}|View in CMS>`] : []),
    ...(a.cvLink ? [`<${a.cvLink}|CV>`] : []),
  ];

  const text = [
    `:inbox_tray: *New application* — ${escapeSlack(a.position)}`,
    `• *${escapeSlack(a.fullName)}* (${escapeSlack(a.email)})`,
    `• Expected salary: €${Number(a.expectedSalary).toLocaleString("en-US")} net`,
    ...(earlier > 0 ? [`• :repeat: Applied before (${earlier} earlier application${earlier > 1 ? "s" : ""})`] : []),
    ...(links.length ? [links.join(" · ")] : []),
  ].join("\n");

  await sendSlackMessage(text);
}

applyRouter.post(
  "/",
  upload.single("cv"),
  async (req: Request, res: Response) => {
    const {
      fullName,
      email,
      phone,
      expectedSalary,
      jobTitle,
      jobSlug,
      linkedin,
      github,
      coverLetter,
    } = req.body;

    if (!fullName || !email || !phone || !expectedSalary || !jobTitle) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Checked before anything is uploaded or saved
    const salaryText = String(expectedSalary).trim();
    if (!/^\d+$/.test(salaryText) || parseInt(salaryText, 10) <= 0) {
      res.status(400).json({ error: "Expected salary must be a number greater than 0" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "CV file is required" });
      return;
    }

    // Blocked applicants get a normal-looking response so they aren't tipped off
    const blocked = await prisma.blockedApplicant.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });
    if (blocked) {
      console.log(`Ignored application from blocked email ${blocked.email}`);
      res.json({ success: true });
      return;
    }

    const job = jobSlug
      ? await prisma.job
          .findUnique({ where: { slug: jobSlug }, include: { technology: true } })
          .catch(() => null)
      : null;
    const technology = job?.technology?.name;
    const position = technology ? `${jobTitle} (${technology})` : jobTitle;

    // Map job title to role and upload the CV before saving, so the application
    // (and the emails) can link to it
    let roleId: string | null = null;
    let cvLink = "";
    try {
      const role = await mapJobTitleToRole(jobTitle);
      roleId = role.id;

      // Upload CV to Bunny CDN under JobApplications/{RoleName}/
      try {
        cvLink = await uploadToBunny(
          req.file.buffer,
          req.file.originalname,
          `JobApplications/${role.name.replace(/\s+/g, "")}`
        );
      } catch (uploadError) {
        console.error("Bunny CDN upload error:", uploadError);
      }
    } catch (roleError) {
      console.error("Failed to map job title to role:", roleError);
    }

    // Save first so the application is never lost to an email or Slack outage.
    // The application and its CV analysis job are written together; the AI Operations
    // Copilot worker picks up pending jobs. No CV link (upload failed) means nothing to analyze.
    let applicationId: string | null = null;
    try {
      if (!roleId) throw new Error(`No role for job title "${jobTitle}"`);

      const created = await prisma.$transaction(async (tx) => {
        const createdApplication = await tx.jobApplication.create({
          data: {
            fullName,
            phone,
            email,
            ...applicationSalaryFromNetEur(parseInt(salaryText, 10)),
            roleId,
            jobTitle,
            jobId: job?.id ?? null,
            cvLink,
          },
        });

        if (cvLink) {
          await tx.candidateAnalysisJob.create({
            data: { applicationId: createdApplication.id },
          });
        }

        return createdApplication;
      });
      applicationId = created.id;
    } catch (dbError) {
      console.error("Failed to save application:", dbError);
    }

    const notification = {
      applicationId,
      position,
      fullName,
      email,
      phone,
      expectedSalary: salaryText,
      linkedin,
      github,
      coverLetter,
      cvLink,
      cvFile: req.file,
    };

    if (applicationId) {
      res.json({ success: true });
      // Notifications run after the response; none of them can fail the application
      sendTeamEmail(notification).catch((err) => console.error("[apply] Team email failed:", err));
    } else {
      // Not saved: the team email is the only record left, so it must go out before we report success
      try {
        await sendTeamEmail(notification);
      } catch (err) {
        console.error("[apply] Application not saved and team email failed:", err);
        res.status(500).json({ error: "Failed to send application" });
        return;
      }
      res.json({ success: true });
    }

    sendApplicantConfirmation(notification).catch((err) =>
      console.error("[apply] Confirmation email failed:", err)
    );
    notifyNewApplication(notification).catch((err) =>
      console.error("[apply] Failed to send Slack notification:", err)
    );
  }
);
