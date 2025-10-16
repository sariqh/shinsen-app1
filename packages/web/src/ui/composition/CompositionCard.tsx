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
  onClearSlot?: (i: Index3) => void; // 参照: 03/3.5 - スロットクリア
  activeSkillIndex?: 0 | 1;
  onSelectSkillSlot?: (slotIndex: Index3, skillIndex: 0 | 1) => void;
  skillById?: Record<string, { name: string }>; // 戦法名表示用
  onEditTitle?: () => void; // 編成名編集
  isCompositionActive?: boolean; // 編成スロット全体がアクティブか
  onSelectComposition?: () => void; // 編成スロット選択
};



export function CompositionCard({ title, composition, warlordById, ownedWarlords = {}, activeSlotIndex, onSelectSlot, onClearSlot, activeSkillIndex, onSelectSkillSlot, skillById = {}, onEditTitle, isCompositionActive = false, onSelectComposition }: Props) {

  return (
    <div className={`w-full bg-white border border-gray-300 rounded shadow-sm ${isCompositionActive ? "ring-2 ring-yellow-400" : ""}`}>
      <div className="px-2 py-1 border-b border-gray-300 text-xs font-semibold bg-gray-50 flex items-center justify-between">
        <button
          className="flex-1 text-left hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSelectComposition?.();
          }}
        >
          {title}
        </button>
        {onEditTitle && (
          <button
            className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEditTitle();
            }}
            aria-label="編成名を編集"
          >
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>
      <div className="p-1">
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
              <div key={idx} className={`flex flex-col ${idx < 2 ? "border-r border-gray-300" : ""}`}>
                {/* 武将スロット */}
                <div className="relative border-b border-gray-300">
                  <button
                    className={`h-5 w-[5ch] mx-auto px-0.5 flex items-center justify-center text-[10px] font-medium truncate transition-all ${bgClass} ${textColorClass} ${
                      isActive ? "ring-2 ring-inset ring-yellow-400 brightness-110" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 通常のアクティブ化のみ（スワップは行わない）
                      onSelectSlot(idx);
                    }}
                    aria-pressed={isActive}
                    title={warlord?.name || `武将${idx + 1}`}
                  >
                    <span className="block w-full text-center text-[10px] leading-tight">
                      {warlord?.name || `武将${idx + 1}`}
                    </span>
                  </button>
                  
                  {/* クリアボタン（武将スロットの右上） */}
                  {warlord && onClearSlot && (
                    <button
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 font-bold rounded shadow-sm z-10"
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
                
                {/* 戦法スロット x2（縦並び） */}
                <div className="flex flex-col border-b border-gray-300">
                  {[0, 1].map((k) => (
                    <button
                      key={k}
                      className={`h-4 w-[6ch] mx-auto flex items-center justify-center text-[9px] px-0.5 transition-colors ${
                        activeSlotIndex === idx && activeSkillIndex === (k as 0|1) ? "bg-yellow-100 text-gray-800" : "bg-gray-50 text-gray-400"
                      } ${k === 0 ? "border-b border-gray-300" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSkillSlot?.(idx, k as 0 | 1);
                      }}
                      aria-pressed={activeSlotIndex === idx && activeSkillIndex === (k as 0|1)}
                    >
                      <span className="truncate">
                        {slot?.skillIds?.[k] && skillById[slot.skillIds[k]] 
                          ? skillById[slot.skillIds[k]].name 
                          : `戦法${k + 1}`}
                      </span>
                    </button>
                  ))}
                </div>
                
                {/* 兵法書スロット x3（横並び） */}
                <div className="grid grid-cols-3 gap-0">
                  {[0, 1, 2].map((k) => (
                    <div
                      key={k}
                      className={`h-3.5 w-[3ch] mx-auto flex items-center justify-center text-[9px] bg-gray-50 text-gray-400 px-0.5 ${
                        k < 2 ? "border-r border-gray-300" : ""
                      }`}
                      aria-disabled
                    >
                      <span className="truncate">兵</span>
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
