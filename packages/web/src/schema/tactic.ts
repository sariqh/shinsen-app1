import { z } from "zod";

export const TacticSchema = z.object({
  id: z.string(),
  name: z.string(),
  updatedAt: z.string().datetime().optional(),
});
export type Tactic = z.infer<typeof TacticSchema>;

