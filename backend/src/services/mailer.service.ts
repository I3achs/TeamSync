import nodemailer from "nodemailer";
import { config } from "../config/app.config"; // Ensure this has SMTP variables

// Cấu hình transporter (sử dụng Gmail hoặc dịch vụ SMTP khác)
// Cần khai báo SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD trong .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"TeamSync Project Management" <${process.env.SMTP_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      html, // html body
    });
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
