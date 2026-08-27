import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
});

export const sender = `"ASN" <no-reply@yourapp.com>`; // Displayed sender name/email
