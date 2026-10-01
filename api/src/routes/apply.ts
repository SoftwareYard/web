import { Router, Request, Response } from "express";
import { Resend } from "resend";
import multer from "multer";
import { uploadToBunny } from "../lib/bunny";
import { mapJobTitleToRole } from "../lib/role-mapper";
import { prisma } from "../lib/prisma";
import { WEBSITE_SENDER, escapeHtml, escapeMultiline } from "../lib/email";
import { grossToNetMK, netToGrossMK } from "../services/salary.calculator.service";

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

// MKD is pegged to EUR by the National Bank of North Macedonia (stable since 1997)
const EUR_TO_MKD_RATE = 61.3;

async function getEurToMkdRate(): Promise<number> {
  return EUR_TO_MKD_RATE;
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

    if (!req.file) {
      res.status(400).json({ error: "CV file is required" });
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
          `JobApplications/${role.name}`
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

    try {
      if (!roleId) throw new Error(`No role for job title "${jobTitle}"`);

      const netEur = parseInt(expectedSalary, 10);

      const rate = await getEurToMkdRate();
      const netMkd = Math.round(netEur * rate);
      const grossMkd = netToGrossMK(netMkd);
      const { net: verifiedNetMkd } = grossToNetMK(grossMkd);
      const grossEur = Math.round(grossMkd / rate);

      await prisma.jobApplication.create({
        data: {
          fullName,
          phone,
          email,
          salaryNetEur: netEur,
          salaryNetMkd: verifiedNetMkd,
          salaryGrossMkd: grossMkd,
          salaryGrossEur: grossEur,
          roleId,
          jobTitle,
          cvLink,
        },
      });
    } catch (dbError) {
      console.error("Failed to save application:", dbError);
    }

    res.json({ success: true });
  }
);
