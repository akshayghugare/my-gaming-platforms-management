import nodemailer from "nodemailer";
import { renderTemplate } from "./templateService";

export interface SmtpConfig {
  host?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  from_email?: string | null;
}

interface SendMailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  // SMTP credentials, always sourced from the DB (email_smtp table).
  smtp?: SmtpConfig | null;
}

export const sendMail = async ({
  to,
  subject,
  template,
  data,
  smtp,
}: SendMailOptions) => {
  try {
    if (!smtp || !smtp.host || !smtp.username || !smtp.password) {
      throw new Error("SMTP is not configured in the database");
    }

    const html = renderTemplate(template, data);

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port) || 587,
      secure: Number(smtp.port) === 465,
      auth: {
        user: smtp.username,
        pass: smtp.password,
      },
      // Render's outbound network has no IPv6 route; without this Node resolves
      // the SMTP host (e.g. Gmail) to IPv6 first and fails with ENETUNREACH.
      // `family: 4` forces the socket to connect over IPv4. (Cast because this
      // @types/nodemailer version doesn't declare `family`, though it is a
      // valid runtime option passed through to net.connect.)
      family: 4,
    } as nodemailer.TransportOptions);

    const from = smtp.from_email || smtp.username;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Mail error:", error);
    throw error;
  }
};
