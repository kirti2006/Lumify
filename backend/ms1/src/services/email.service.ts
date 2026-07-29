import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (
  to: string,
  subject: string,
  bodyHtml: string,
  bodyText?: string
) => {
  try {
    const data = await resend.emails.send({
      // "onboarding@resend.dev" is required for free-tier accounts sending to their registered email
      from: "Lumify <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: bodyHtml,
      text: bodyText || "",
    });
    console.log(`Email sent to ${to} via Resend. ID: ${data.data?.id}`);
  } catch (error) {
    console.error("Resend Email Error:", error);
  }
};