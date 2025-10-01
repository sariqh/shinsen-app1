import { create } from "zustand";
import type { Composition } from "@/src/schema/composition";

// 参照: 03/11.1 useComposerStore の構造定義
type ActiveSlot = {
  compositionId: string;
  slotId: string; // "warlord_0", "skill_0_0", "tactic_0_1" など
  type: "warlord" | "skill" | "tactic" | "attr" | "equipSkill" | "memo";
} | null;

type ComposerState = {
  // 参照: 03/1.2 フリー1編成、共存性5編成
  drafts: {
    free: Composition | null;
    coexist: Composition[]; // 最大5編成
  };
  activeSlot: ActiveSlot;
  scale: number; // 0.75 / 1.0 / 1.25（参照: 03/12.2）
  pan: { x: number; y: number };
  
  setDrafts: (drafts: { free?: Composition | null; coexist?: Composition[] }) => void;
  setActiveSlot: (slot: ActiveSlot) => void;
  setScale: (s: number) => void;
  setPan: (x: number, y: number) => void;
};

export const useComposerStore = create<ComposerState>((set) => ({
  drafts: {
    free: null,
    coexist: [],
  },
  activeSlot: null,
  scale: 1.0,
  pan: { x: 0, y: 0 },
  
  setDrafts: (drafts) => set((state) => ({
    drafts: {
      free: drafts.free !== undefined ? drafts.free : state.drafts.free,
      coexist: drafts.coexist !== undefined ? drafts.coexist : state.drafts.coexist,
    },
  })),
  setActiveSlot: (slot) => set({ activeSlot: slot }),
  setScale: (s) => set({ scale: s }),
  setPan: (x, y) => set({ pan: { x, y } }),
}));

