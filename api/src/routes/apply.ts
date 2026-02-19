import { Router, Request, Response } from "express";
import { Resend } from "resend";
import multer from "multer";
import { uploadToBunny } from "../lib/bunny";
import { mapJobTitleToRole } from "../lib/role-mapper";
import { prisma } from "../lib/prisma";
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

    const { error } = await resend.emails.send({
      from: "SoftwareYard <noreply@softwareyard.co>",
      to: "careers@softwareyard.co",
      replyTo: email,
      subject: `New applicant for ${jobTitle}`,
      html: `
        <h2>New Job Application</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Expected Salary:</strong> ${expectedSalary}</p>
        <p><strong>LinkedIn:</strong> ${linkedin || "N/A"}</p>
        <p><strong>GitHub:</strong> ${github || "N/A"}</p>
        <hr />
        <p><strong>Cover Letter:</strong></p>
        <p>${coverLetter || "N/A"}</p>
      `,
      attachments: [
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

    // Map job title to role, upload CV, and calculate salary
    let cvLink = "";
    try {
      const { id: roleId, name: roleName } = await mapJobTitleToRole(jobTitle);

      // Upload CV to Bunny CDN under JobApplications/{RoleName}/
      try {
        cvLink = await uploadToBunny(
          req.file.buffer,
          req.file.originalname,
          `JobApplications/${roleName}`
        );
      } catch (uploadError) {
        console.error("Bunny CDN upload error:", uploadError);
      }

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
