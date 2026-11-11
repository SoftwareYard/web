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

async function notifyNewApplication(a: {
  applicationId: string | null;
  position: string;
  fullName: string;
  email: string;
  expectedSalary: string;
  cvLink: string;
}) {
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

    // Checked before any email goes out, so a bad value can't leave an emailed but unsaved application
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

    // Map job title to role and upload CV first, so the email can link to it
    // instead of attaching the PDF (attachments push mail into spam)
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

    const cvHtml = cvLink
      ? `<a href="${escapeHtml(cvLink)}">${escapeHtml(req.file.originalname)}</a>`
      : "Attached";

    const { error } = await resend.emails.send({
      from: WEBSITE_SENDER,
      to: "careers@softwareyard.co",
      replyTo: email,
      subject: `${position} - ${fullName}`,
      html: `
        <h2>New Job Application</h2>
        <p><strong>Position:</strong> ${escapeHtml(position)}</p>
        <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Expected Salary:</strong> ${escapeHtml(expectedSalary)}</p>
        <p><strong>LinkedIn:</strong> ${escapeHtml(linkedin || "N/A")}</p>
        <p><strong>GitHub:</strong> ${escapeHtml(github || "N/A")}</p>
        <p><strong>CV:</strong> ${cvHtml}</p>
        <hr />
        <p><strong>Cover Letter:</strong></p>
        <p>${escapeMultiline(coverLetter || "N/A")}</p>
      `,
      text: [
        "New Job Application",
        "",
        `Position: ${position}`,
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Expected Salary: ${expectedSalary}`,
        `LinkedIn: ${linkedin || "N/A"}`,
        `GitHub: ${github || "N/A"}`,
        `CV: ${cvLink || "Attached"}`,
        "",
        "Cover Letter:",
        coverLetter || "N/A",
      ].join("\n"),
      // Only fall back to attaching the CV when the upload failed
      attachments: cvLink
        ? undefined
        : [
            {
              filename: req.file.originalname,
              content: req.file.buffer,
            },
          ],
    });

    if (error) {
      console.error("Resend error:", error);
      res.status(500).json({ error: "Failed to send application" });
      return;
    }

    // Confirmation to the applicant — a failure here must not fail the application
    const firstName = String(fullName).trim().split(/\s+/)[0];
    const { error: confirmationError } = await resend.emails.send({
      from: CAREERS_SENDER,
      to: email,
      replyTo: "careers@softwareyard.co",
      subject: `Thank you for applying for ${position}`,
      html: `
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>Thank you for applying for the <strong>${escapeHtml(position)}</strong> position at SoftwareYard.</p>
        <p>We have received your application and our team will review it carefully. If your profile is a good fit for the role, we will get back to you with the next steps.</p>
        <p>Best regards,<br />SoftwareYard Team</p>
      `,
      text: [
        `Hi ${firstName},`,
        "",
        `Thank you for applying for the ${position} position at SoftwareYard.`,
        "",
        "We have received your application and our team will review it carefully. If your profile is a good fit for the role, we will get back to you with the next steps.",
        "",
        "Best regards,",
        "SoftwareYard Team",
      ].join("\n"),
    });
    if (confirmationError) {
      console.error("Resend confirmation email error:", confirmationError);
    }

    let applicationId: string | null = null;
    try {
      if (!roleId) throw new Error(`No role for job title "${jobTitle}"`);


      const created = await prisma.jobApplication.create({
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
      applicationId = created.id;
    } catch (dbError) {
      console.error("Failed to save application:", dbError);
    }

    // Heads-up in sy_info; never delays or fails the application
    notifyNewApplication({
      applicationId,
      position,
      fullName,
      email,
      expectedSalary: salaryText,
      cvLink,
    }).catch((err) => console.error("[apply] Failed to send Slack notification:", err));

    res.json({ success: true });
  }
);
