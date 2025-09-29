import { WorkspaceSchema, type Workspace } from "@/src/schema/workspace";

// 参照: 07/4 Workspace GET|POST、UIビューステートは保存しない（参照: 06/2.6）
export async function getWorkspace(userId: string): Promise<Workspace> {
  return WorkspaceSchema.parse({ freeAreaCompositionIds: [], constraintAreaCompositionIds: [] });
}

export async function upsertWorkspace(userId: string, payload: Workspace): Promise<Workspace> {
  return WorkspaceSchema.parse(payload);
}

