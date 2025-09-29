import { z } from "zod";

export const WorkspaceSchema = z.object({
  workspaceId: z.string().default("current"),
  freeAreaCompositionIds: z.array(z.string()).max(10).default([]),
  constraintAreaCompositionIds: z.array(z.string()).max(5).default([]),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;