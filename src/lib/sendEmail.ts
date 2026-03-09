import nodemailer from "nodemailer";

interface EmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  const transporter = nodemailer.createTransport({
    host: "server.yalla-web.com",
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}