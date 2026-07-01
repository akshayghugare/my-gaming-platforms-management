import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false, // true for 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  // Render's outbound network has no IPv6 route; without this Node resolves
  // the SMTP host (e.g. Gmail) to IPv6 first and fails with ENETUNREACH.
  // `family: 4` forces the socket to connect over IPv4. (Cast because this
  // @types/nodemailer version doesn't declare `family`, though it is a valid
  // runtime option passed through to net.connect.)
  family: 4,
} as nodemailer.TransportOptions);

export default transporter;