"use client";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import type { Composition } from "@/src/schema/composition";
import type { Warlord } from "@/src/schema/warlord";
import { CompositionCard } from "@/src/ui/composition/CompositionCard";

type Index3 = 0 | 1 | 2;
type CompositionIndex = 0 | 1 | 2;

type Props = {
  compositions: [Composition, Composition, Composition];
  warlordById: Record<string, Warlord>;
  ownedWarlords?: Record<string, number>;
  activeCompositionIndex?: CompositionIndex | null;
  activeSlotIndex?: Index3 | null;
  onSelectSlot: (compositionIndex: CompositionIndex, slotIndex: Index3) => void;
  onClearSlot?: (compositionIndex: CompositionIndex, slotIndex: Index3) => void;
  onBackgroundClick?: () => void;
  activeSkillIndex?: 0 | 1 | null;
  onSelectSkillSlot?: (compositionIndex: CompositionIndex, slotIndex: Index3, skillIndex: 0 | 1) => void;
  skillById?: Record<string, { name: string }>;
  compositionNames: [string, string, string]; // 編成名
  onEditCompositionName?: (compositionIndex: CompositionIndex) => void; // 編成名編集
  activeCompositionSlot?: CompositionIndex | null; // 編成スロット全体がアクティブか
  onSelectCompositionSlot?: (compositionIndex: CompositionIndex) => void; // 編成スロット選択
};

export function CompositionBoard({ compositions, warlordById, ownedWarlords, activeCompositionIndex, activeSlotIndex, onSelectSlot, onClearSlot, onBackgroundClick, activeSkillIndex, onSelectSkillSlot, skillById, compositionNames, onEditCompositionName, activeCompositionSlot, onSelectCompositionSlot }: Props) {
  return (
    <div className="w-full h-full border rounded bg-white overflow-hidden relative">
      <TransformWrapper 
        minScale={0.75} 
        maxScale={1.25} 
        initialScale={1} 
        wheel={{ disabled: true }} 
        doubleClick={{ disabled: true }}
        panning={{ disabled: false }}
        limitToBounds={false}
        centerOnInit={false}
        disablePadding={true}
      >
        {() => (
          <TransformComponent 
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "max-content", height: "max-content" }}
          >
              <div className="w-max p-2" onClick={onBackgroundClick}>
                <div className="flex flex-col gap-2">
                  {[0, 1, 2].map((ci) => (
                    <CompositionCard
                      key={ci}
                      title={compositionNames[ci]}
                      composition={compositions[ci as CompositionIndex]}
                      warlordById={warlordById}
                      ownedWarlords={ownedWarlords}
                      activeSlotIndex={activeCompositionIndex === ci && activeSlotIndex !== null ? activeSlotIndex : undefined}
                      activeSkillIndex={activeCompositionIndex === ci && activeSkillIndex !== null ? activeSkillIndex : undefined}
                      onSelectSkillSlot={onSelectSkillSlot ? (si, sk) => onSelectSkillSlot(ci as CompositionIndex, si, sk) : undefined}
                      skillById={skillById}
                      onSelectSlot={(si) => onSelectSlot(ci as CompositionIndex, si)}
                      onClearSlot={onClearSlot ? (si) => onClearSlot(ci as CompositionIndex, si) : undefined}
                      onEditTitle={onEditCompositionName ? () => onEditCompositionName(ci as CompositionIndex) : undefined}
                      isCompositionActive={activeCompositionSlot === ci}
                      onSelectComposition={onSelectCompositionSlot ? () => onSelectCompositionSlot(ci as CompositionIndex) : undefined}
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