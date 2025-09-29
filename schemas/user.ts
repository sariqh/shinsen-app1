
import { z } from "zod";

export const User = z.object({
  userId: z.string(),
  displayName: z.string(),
  email: z.string().email().nullable().optional(),
  createdAt: z.string().optional(), // ISO
  updatedAt: z.string().optional(), // ISO
});

export type User = z.infer<typeof User>;
