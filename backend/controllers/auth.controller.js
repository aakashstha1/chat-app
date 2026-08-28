import {
  forgotPasswordService,
  googleAuthService,
  loginService,
  resendCodeService,
  resetPasswordService,
  verifyEmailService,
} from "../services/auth.service.js";
import { createUser, getMe } from "../services/user.service.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  emailValidator,
  loginSchema,
  registerSchema,
  verifyEmailValidator,
} from "../validators/auth.validator.js";

// ------------------------------------------------ Register ---------------------------------------
export const register = async (req, res, next) => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success)
      throw new AppError(result.error.issues[0].message, 400);

    const user = await createUser(result.data);
    return res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------Verify Email--------------------------------------------------
export const verifyEmail = async (req, res, next) => {
  try {
    const result = await verifyEmailValidator.safeParse(req.body);

    if (!result.success)
      throw new AppError(result.error.issues[0].message, 400);

    const user = verifyEmailService(result.data);

    generateTokenAndSetCookie(res, user._id);

    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------Resend code--------------------------------------------------
export const resendCode = async (req, res, next) => {
  try {
    const result = emailValidator.safeParse(req.body);

    if (!result.success)
      throw new AppError(result.error.issues[0].message, 400);

    await resendCodeService(result.data.email);

    res
      .status(200)
      .json({ success: true, message: "Verification code resent" });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------Login--------------------------------------------------
export const login = async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success)
      throw new AppError(result.error.issues[0].message, 400);

    const user = await loginService(result.data);

    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------Logout--------------------------------------------------
export const logout = async (req, res, next) => {
  try {
    res.clearCookie("chat_token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------Current user--------------------------------------------------
export const checkAuth = async (req, res, next) => {
  try {
    const user = await getMe(req.userId);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------Forget password--------------------------------------------------
export const forgotPassword = async (req, res, next) => {
  try {
    const result = emailValidator.safeParse(req.body);

    if (!result.success)
      throw new AppError(result.error.issues[0].message, 400);

    await forgotPasswordService(result.data);

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------Reset password--------------------------------------------------
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    await resetPasswordService({ token, password });

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.log("Error in resetPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// --------------------------------------------Google OAuth--------------------------------------------------
export const googleAuth = async (req, res, next) => {
  try {
    const user = await googleAuthService(req.body);

    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: "Logged in with Google",
      user,
    });
  } catch (error) {
    next(error);
  }
};
