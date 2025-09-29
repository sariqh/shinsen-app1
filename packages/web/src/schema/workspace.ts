import { z } from "zod";

// 参照: 06/2.6, 06/3.2.4 workspace は UI 配置ID群のみ保持
export const WorkspaceSchema = z.object({
  freeAreaCompositionIds: z.array(z.string()).default([]),
  constraintAreaCompositionIds: z.array(z.string()).default([]),
  updatedAt: z.string().datetime().optional()
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

