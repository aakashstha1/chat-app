import { z } from "zod";

// -------------------------------------------------------------------- AI Chat ------------------------------------------
export const aiChatSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long"),
});
