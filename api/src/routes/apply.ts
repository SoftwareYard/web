import { Router, Request, Response } from "express";
import { Resend } from "resend";
import multer from "multer";
import { uploadToBunny } from "../lib/bunny";
import { mapJobTitleToRole } from "../lib/role-mapper";
import { prisma } from "../lib/prisma";
import { grossToNetMK } from "../services/salary.calculator.service";

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

async function getEurToMkdRate(): Promise<number> {
  const res = await fetch(
    "https://api.frankfurter.app/latest?from=EUR&to=MKD"
  );
  if (!res.ok) throw new Error("Failed to fetch EUR/MKD rate");
  const data = (await res.json()) as { rates: { MKD: number } };
  return data.rates.MKD;
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

      const grossEur = parseInt(expectedSalary, 10);

      const rate = await getEurToMkdRate();
      const grossMkd = Math.round(grossEur * rate);
      const { net: netMkd } = grossToNetMK(grossMkd);
      const netEur = Math.round(netMkd / rate);

      await prisma.jobApplication.create({
        data: {
          fullName,
          phone,
          email,
          grossSalary: grossEur,
          salaryGrossEur: grossEur,
          salaryGrossMkd: grossMkd,
          salaryNetEur: netEur,
          salaryNetMkd: netMkd,
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
