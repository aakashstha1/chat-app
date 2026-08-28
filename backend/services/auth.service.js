import { AppError } from "../utils/AppError.js";
import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { publicUser } from "../utils/publicUser.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../nodemailer/emails.js";
import { OAuth2Client } from "google-auth-library";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

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

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("User is already verified", 400);
  }

  if (
    user.lastVerificationEmailSentAt &&
    Date.now() - user.lastVerificationEmailSentAt.getTime() < 60 * 1000
  ) {
    throw new AppError(
      "Please wait 1 minute before requesting another code",
      429,
    );
  }

  const verificationToken = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();

  user.verificationToken = verificationToken;
  user.verificationTokenExpiresAt = Date.now() + 15 * 60 * 1000;
  user.lastVerificationEmailSentAt = new Date();

  await user.save();

  await sendVerificationEmail(user.email, verificationToken);
};

// --------------------------------------------Login--------------------------------------------------
export const loginService = async (loginData) => {
  const { identifier, password } = loginData;

  const query = emailRegex.test(identifier)
    ? { email: identifier.toLowerCase() }
    : { username: identifier.toLowerCase() };

  const user = await User.findOne(query);

  // The AI system account has no password and must never be reachable
  // through normal login, regardless of what identifier is supplied.
  // (It already can't authenticate since it has no password, but this
  // makes the intent explicit and avoids relying on that side effect.)
  if (!user || user.accountType === "ai" || !user.password) {
    throw new AppError("Invalid credentials", 400);
  }

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
  await sendPasswordResetEmail(
    user.email,
    `${clientUrl}/reset-password/${resetToken}`,
  );
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
};

// --------------------------------------------Google OAuth--------------------------------------------------
export const googleAuthService = async (req, res) => {
  const { credential } = req.body;
  if (!credential) throw new AppError("Missing credential", 400);

  if (!googleClient)
    throw new AppError("Google OAuth is not configured on the server", 500);

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email_verified) throw new AppError("Email is not verified", 400);

  let user = await User.findOne({
    $or: [{ googleId }, { email: email.toLowerCase() }],
  });

  if (user?.accountType === "ai") {
    throw new AppError("Invalid credentials", 400);
  }

  if (!user) {
    // generate a unique username from the email prefix
    let base =
      email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, "")
        .slice(0, 20) || "user";
    let candidate = base;
    let i = 0;
    while (await User.findOne({ username: candidate })) {
      i += 1;
      candidate = `${base}${i}`;
    }

    user = new User({
      username: candidate,
      email: email.toLowerCase(),
      name: name || candidate,
      avatar: picture || "",
      provider: "google",
      googleId,
      isVerified: true,
    });
    await user.save();
  } else if (!user.googleId) {
    user.googleId = googleId;
    user.isVerified = true;
    if (!user.avatar && picture) user.avatar = picture;
    await user.save();
  }

  return publicUser(user);
};
