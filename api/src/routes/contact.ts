import { Router, Request, Response } from "express";
import { Resend } from "resend";
import { WEBSITE_SENDER, escapeHtml, escapeMultiline } from "../lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);
export const contactRouter = Router();

contactRouter.post("/", async (req: Request, res: Response) => {
  const { firstName, lastName, email, company, message } = req.body;

  if (!firstName || !lastName || !email || !message) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const { error } = await resend.emails.send({
    from: WEBSITE_SENDER,
    to: "contact@softwareyard.co",
    replyTo: email,
    subject: `New inquiry from ${firstName} ${lastName}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Company:</strong> ${escapeHtml(company || "N/A")}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${escapeMultiline(message)}</p>
    `,
    text: [
      "New Contact Form Submission",
      "",
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      `Company: ${company || "N/A"}`,
      "",
      "Message:",
      message,
    ].join("\n"),
  });

  if (error) {
    console.error("Resend error:", error);
    res.status(500).json({ error: "Failed to send email" });
    return;
  }

  res.json({ success: true });
});
