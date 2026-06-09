import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || "Brahma Graha <no-reply@brahmagraha.ai>";

  // If SMTP configuration is missing, mock to console for local development
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.log("\n=================== [MOCK EMAIL SERVICE] ===================");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("------------------------------------------------------------");
    console.log(text);
    console.log("============================================================\n");
    return { messageId: "mock-message-id", mock: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465, // True for port 465, false for others (like 587)
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const info = await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    text,
    html,
  });

  console.log(`[EMAIL SERVICE] Email sent successfully: ${info.messageId}`);
  return { messageId: info.messageId, mock: false };
}
