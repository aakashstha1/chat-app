import { AppError } from "../utils/AppError.js";
import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";
import { transporter, sender } from "../configs/nodemailer.config.js";

// --------------------------------------------Send Verification Email--------------------------------------------------
export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken,
      ),
    });
  } catch (error) {
    console.log(error);
    throw new AppError("Failed to send verification email", 500);
  }
};

// -------------------------------------------- Send Reset Password Email--------------------------------------------------
export const sendPasswordResetEmail = async (email, resetURL) => {
  try {
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: "Reset your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};
