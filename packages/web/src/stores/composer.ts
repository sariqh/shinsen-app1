import { create } from "zustand";

type ComposerState = {
  activeSlotIndex: 0 | 1 | 2;
  scale: number; // 0.75 / 1.0 / 1.25（参照: 03/12.2）
  pan: { x: number; y: number };
  setActiveSlotIndex: (i: 0 | 1 | 2) => void;
  setScale: (s: number) => void;
  setPan: (x: number, y: number) => void;
};

export const useComposerStore = create<ComposerState>((set) => ({
  activeSlotIndex: 0,
  scale: 1.0,
  pan: { x: 0, y: 0 },
  setActiveSlotIndex: (i) => set({ activeSlotIndex: i }),
  setScale: (s) => set({ scale: s }),
  setPan: (x, y) => set({ pan: { x, y } }),
}));

