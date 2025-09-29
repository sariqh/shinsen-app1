import { create } from "zustand";

type AssetsUIState = {
  ownershipAware: boolean; // 参照: 03/3 所有物トグル
  toggleOwnershipAware: () => void;
};

export const useAssetsUIStore = create<AssetsUIState>((set, get) => ({
  ownershipAware: true,
  toggleOwnershipAware: () => set({ ownershipAware: !get().ownershipAware }),
}));

