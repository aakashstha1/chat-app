import { AppError } from "../utils/AppError.js";
import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { publicUser } from "../utils/publicUser.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --------------------------------------------Verify Email--------------------------------------------------
export const verifyEmailService = async (data) => {
  const { email, code } = data;

  const user = await User.findOne({
    email,
    verificationToken: code,
    verificationTokenExpiresAt: { $gt: Date.now() },
  });

  if (!user) throw new AppError("Invalid or expired verification code", 400);

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiresAt = undefined;
  await user.save();

  // await sendWelcomeEmail(user.email, user.name);

  return publicUser(user);
};

// --------------------------------------------Resend code--------------------------------------------------
export const resendCodeService = async (email) => {
  const user = await User.findOne({ email });

  if (!user) throw new AppError("User not found", 404);

  if (user.isVerified) throw new AppError("User is already verified", 400);

  const verificationToken = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();

  user.verificationToken = verificationToken;

  user.verificationTokenExpiresAt = Date.now() + 15 * 60 * 1000;

  await user.save();

  // await sendVerificationEmail(user.email, verificationToken);
};

// --------------------------------------------Login--------------------------------------------------
export const loginService = async (loginData) => {
  const { identifier, password } = loginData;

  const query = emailRegex.test(identifier)
    ? { email: identifier.toLowerCase() }
    : { username: identifier.toLowerCase() };

  const user = await User.findOne(query);

  if (!user || !user.password) throw new AppError("Invalid credentials", 400);

  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email before logging in",
      needsVerification: true,
      email: user.email,
    });
  }

  const isPasswordValid = await bcryptjs.compare(password, user.password);
  if (!isPasswordValid) throw new AppError("Invalid credentials", 400);

  return publicUser(user);
};

// --------------------------------------------Forget password--------------------------------------------------
export const forgotPasswordService = async (data) => {
  const { email } = data;

  const user = await User.findOne({ email });

  if (!user) throw new AppError("User not found", 404);

  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpiresAt = resetTokenExpiresAt;

  await user.save();

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  // await sendPasswordResetEmail(
  //   user.email,
  //   `${clientUrl}/reset-password/${resetToken}`,
  // );
};

// --------------------------------------------Reset password--------------------------------------------------
export const resetPasswordService = async ({ token, password }) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiresAt: { $gt: Date.now() },
  });

  if (!user) throw new AppError("Invalid or expired reset token", 400);

  const hashedPassword = await bcryptjs.hash(password, 10);

  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  // await sendResetSuccessEmail(user.email);
};
