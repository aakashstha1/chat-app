import { z } from "zod";

// ---------------------------------------------------- Register ------------------------------------------
export const ProfileValidator = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),

  bio: z
    .string()
    .trim()
    .min(1, "Bio is required")
    .max(250, "Bio must be at most 250 characters")
    .optional(),
});
