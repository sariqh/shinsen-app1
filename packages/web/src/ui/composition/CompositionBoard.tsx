"use client";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import type { Composition } from "@/src/schema/composition";
import type { Warlord } from "@/src/schema/warlord";
import { CompositionCard } from "@/src/ui/composition/CompositionCard";

type Index3 = 0 | 1 | 2;

type Props = {
  compositions: [Composition, Composition];
  warlordById: Record<string, Warlord>;
  ownedWarlords?: Record<string, number>;
  activeCompositionIndex?: 0 | 1;
  activeSlotIndex?: Index3;
  onSelectSlot: (compositionIndex: 0 | 1, slotIndex: Index3) => void;
  onSwapSlots?: (compositionIndex: 0 | 1, targetIndex: Index3) => void;
  onClearSlot?: (compositionIndex: 0 | 1, slotIndex: Index3) => void;
};

export function CompositionBoard({ compositions, warlordById, ownedWarlords, activeCompositionIndex, activeSlotIndex, onSelectSlot, onSwapSlots, onClearSlot }: Props) {
  return (
    <div className="w-full h-full border rounded bg-white overflow-hidden relative">
      <TransformWrapper minScale={0.75} maxScale={1.25} initialScale={1} wheel={{ disabled: true }} doubleClick={{ disabled: true }}>
        {() => (
          <TransformComponent>
              <div className="w-max p-4">
                <div className="flex gap-4">
                  {[0, 1].map((ci) => (
                    <CompositionCard
                      key={ci}
                      title={ci === 0 ? "編成A" : "編成B"}
                      composition={compositions[ci as 0 | 1]}
                      warlordById={warlordById}
                      ownedWarlords={ownedWarlords}
                      activeSlotIndex={activeCompositionIndex === ci ? activeSlotIndex : undefined}
                      onSelectSlot={(si) => onSelectSlot(ci as 0 | 1, si)}
                      onSwapSlots={activeCompositionIndex === ci && onSwapSlots ? (ti) => onSwapSlots(ci as 0 | 1, ti) : undefined}
                      onClearSlot={onClearSlot ? (si) => onClearSlot(ci as 0 | 1, si) : undefined}
                    />
                  ))}
                </div>
              </div>
          </TransformComponent>
        )}
      </TransformWrapper>
    </div>
  );
}
