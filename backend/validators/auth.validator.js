import { z } from "zod";

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

export const loginSchema = z.object({
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
});
