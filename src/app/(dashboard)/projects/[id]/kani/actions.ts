"use server";

import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  attachments?: { name: string; size: string; type: string }[];
}

export async function sendLiveSMTPEmail(payload: EmailPayload) {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT || "587", 10);
  const user = process.env.EMAIL_HOST_USER || "23cs075@kpriet.ac.in";
  const pass = process.env.EMAIL_HOST_PASSWORD || "ahwgzdjevaxaaand";
  const from = process.env.DEFAULT_FROM_EMAIL || "23cs075@kpriet.ac.in";

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false
      }
    });

    // Verify SMTP connection configuration
    await transporter.verify();

    // Map attachments to nodemailer format
    const mailAttachments = payload.attachments?.map(att => ({
      filename: att.name,
      content: `This is a mock contents file generated dynamically for transmittal: ${att.name} (${att.size})`,
      contentType: att.type
    })) || [];

    const mailOptions = {
      from: `"Lead Draftsman" <${from}>`,
      to: payload.to,
      cc: payload.cc || undefined,
      subject: payload.subject,
      text: payload.body,
      attachments: mailAttachments
    };

    const info = await transporter.sendMail(mailOptions);
    return { 
      success: true, 
      messageId: info.messageId,
      host,
      user
    };
  } catch (error: any) {
    console.error("SMTP Client error sending email:", error);
    return {
      success: false,
      error: error.message || "Unknown SMTP error occurred"
    };
  }
}
