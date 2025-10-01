import type { Composition } from "@/src/schema/composition";
import type { Warlord } from "@/src/schema/warlord";

type Index3 = 0 | 1 | 2;
type Camp = 0 | 1 | 2 | 3; // 0:魏 1:呉 2:蜀 3:群

// 陣営別の背景色（参照: WarlordPalette.tsx）
const BG_CLASSES: Record<Camp, string[]> = {
  0: ["bg-blue-100", "bg-blue-200", "bg-blue-300", "bg-blue-400", "bg-blue-500", "bg-blue-700"],
  1: ["bg-red-100", "bg-red-200", "bg-red-300", "bg-red-400", "bg-red-500", "bg-red-700"],
  2: ["bg-green-100", "bg-green-200", "bg-green-300", "bg-green-400", "bg-green-500", "bg-green-700"],
  3: ["bg-yellow-100", "bg-yellow-200", "bg-yellow-300", "bg-yellow-400", "bg-yellow-500", "bg-yellow-600"],
};

const CAMP_ENUM_TO_INDEX: Record<number, Camp> = { 1: 0, 2: 1, 3: 2, 4: 3 };

function textClass(camp: Camp, level: number): string {
  // 高濃度は可読性のため、青/赤/緑は白、黄は黒
  if (level >= 4) return camp === 3 ? "text-black" : "text-white";
  return "text-gray-900";
}

type Props = {
  title: string;
  composition: Composition;
  warlordById: Record<string, Warlord>;
  ownedWarlords?: Record<string, number>; // warlordId -> 所持枚数
  activeSlotIndex?: Index3; // 親から受け取る
  onSelectSlot: (i: Index3) => void;
  onSwapSlots?: (targetIndex: Index3) => void; // 参照: 03/3.4 - スロット間スワップ
  onClearSlot?: (i: Index3) => void; // 参照: 03/3.5 - スロットクリア
};

export function CompositionCard({ title, composition, warlordById, ownedWarlords = {}, activeSlotIndex, onSelectSlot, onSwapSlots, onClearSlot }: Props) {

  return (
    <div className="min-w-[480px] bg-white border-2 border-gray-300 rounded-lg shadow-md">
      <div className="px-3 py-2 border-b-2 border-gray-300 text-sm font-semibold bg-gray-50">{title}</div>
      <div className="p-2">
        <div className="grid grid-cols-3 gap-0">
          {[0, 1, 2].map((i) => {
            const idx = i as Index3;
            const slot = composition.slots[idx];
            const warlord = slot?.warlordId ? warlordById[slot.warlordId] : null;
            const isActive = activeSlotIndex === idx;
            
            // 陣営色と凸数による背景色
            let bgClass = "bg-white";
            let textColorClass = "text-gray-900";
            if (warlord) {
              const copies = ownedWarlords[warlord.id] || 0;
              const limitBreak = Math.min(5, Math.max(0, copies - 1));
              const campIndex = CAMP_ENUM_TO_INDEX[warlord.camp];
              if (campIndex !== undefined) {
                bgClass = BG_CLASSES[campIndex][limitBreak];
                textColorClass = textClass(campIndex, limitBreak);
              }
            }
            
            return (
              <div key={idx} className="flex flex-col border-r border-gray-300 last:border-r-0">
                {/* 武将スロット */}
                <div className="relative border-b border-gray-300">
                  <button
                    className={`h-14 w-full px-2 flex items-center justify-center text-sm font-medium truncate transition-all ${bgClass} ${textColorClass} ${
                      isActive ? "ring-4 ring-inset ring-yellow-400 brightness-110 scale-[0.98]" : ""
                    }`}
                    onClick={() => {
                      // 通常のアクティブ化のみ（スワップは行わない）
                      onSelectSlot(idx);
                    }}
                    aria-pressed={isActive}
                    title={warlord?.name || `武将${idx + 1}`}
                  >
                    <span className="block w-full text-center">
                      {warlord?.name || `武将${idx + 1}`}
                    </span>
                  </button>
                  
                  {/* クリアボタン（武将スロットの右上） */}
                  {warlord && onClearSlot && (
                    <button
                      className="absolute top-0.5 right-0.5 w-6 h-6 bg-red-500 text-white text-sm flex items-center justify-center hover:bg-red-600 font-bold rounded shadow-sm z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearSlot(idx);
                      }}
                      aria-label={`${warlord.name}をクリア`}
                    >
                      ×
                    </button>
                  )}
                </div>
                
                {/* 戦法スロット x2 */}
                <div className="grid grid-cols-2 gap-0 border-b border-gray-300">
                  {[0, 1].map((k) => (
                    <div
                      key={k}
                      className={`h-11 flex items-center justify-center text-xs bg-gray-50 text-gray-400 px-1 ${
                        k === 0 ? "border-r border-gray-300" : ""
                      }`}
                      aria-disabled
                    >
                      <span className="truncate">戦法{k + 1}</span>
                    </div>
                  ))}
                </div>
                
                {/* 兵法書スロット x3（縦並び） */}
                <div className="flex flex-col">
                  {[0, 1, 2].map((k) => (
                    <div
                      key={k}
                      className={`h-9 flex items-center justify-center text-xs bg-gray-50 text-gray-400 px-1 ${
                        k < 2 ? "border-b border-gray-300" : ""
                      }`}
                      aria-disabled
                    >
                      <span className="truncate">兵法{k + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
