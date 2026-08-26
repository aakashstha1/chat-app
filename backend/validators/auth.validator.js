import { z } from "zod";

// ---------------------------------------------------- Register ------------------------------------------
export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be at most 24 characters")
    .regex(
      /^[a-z0-9_.]+$/,
      "Username can only contain lowercase letters, numbers, underscores and dots",
    ),

  email: z.string().trim().toLowerCase().email("Invalid email address"),

  password: z.string().min(6, "Password must be at least 6 characters"),

  name: z.string().trim().min(1, "Name is required"),
});

// -------------------------------------------------------------------- Login ------------------------------------------
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username or email is required"),

  password: z.string().min(6, "Password must be at least 6 characters"),
});

// -------------------------------------------------------------------- Verify Email ------------------------------------------
export const verifyEmailValidator = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),

  code: z.string(),
});

// -------------------------------------------------------------------- Resend Code ------------------------------------------
export const emailValidator = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});
