import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import type { SupportFormBody } from "../validation/support.schemas.js";

export async function sendSupportEmails(body: SupportFormBody): Promise<void> {
  if (!env.EMAIL_USER || !env.EMAIL_PASS || !env.EMAIL_RECEIVER) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  const adminMailOptions = {
    from: `"${body.name}" <${env.EMAIL_USER}>`,
    replyTo: body.email,
    to: env.EMAIL_RECEIVER,
    subject: body.subject || "New Support Request",
    html: `
        <h2>New Support Request</h2>
        <p><strong>Name:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Number:</strong> ${body.number}</p>
        <p><strong>Subject:</strong> ${body.subject}</p>
        <p><strong>Message:</strong><br>${body.message}</p>
      `,
  };

  await transporter.sendMail(adminMailOptions);

  const userMailOptions = {
    from: `"Support Team" <${env.EMAIL_USER}>`,
    to: body.email,
    subject: "Thank you for contacting our support team",
    html: `
        <h3>Hi ${body.name},</h3>
        <p>Thank you for reaching out to our support team.</p>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <br/>
        <p>— The Support Team</p>
      `,
  };

  await transporter.sendMail(userMailOptions);
}
