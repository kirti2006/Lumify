import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
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