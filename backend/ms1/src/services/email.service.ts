import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  bodyHtml: string,
  bodyText?: string
) => {
  await transporter.sendMail({
    from: `"Lumify" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html: bodyHtml,
    text: bodyText,
  });

  console.log(`Email sent to ${to}`);
};