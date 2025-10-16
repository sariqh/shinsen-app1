import type { Warlord } from "@/src/schema/warlord";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

type Camp = 0 | 1 | 2 | 3; // 0:魏 1:呉 2:蜀 3:群 — 内部の数値Enum(1..4)とは異なるインデックス

// 参照: 06/3.3 数値Enum（1=魏 2=呉 3=蜀 4=群）
const CAMP_LABELS = ["魏", "呉", "蜀", "群"] as const;
const CAMP_ENUM_TO_INDEX: Record<number, Camp> = { 1: 0, 2: 1, 3: 2, 4: 3 };

// 陣営別の背景色（参照: assets/page.tsx の実装）
const BG_CLASSES: Record<Camp, string[]> = {
  0: ["bg-blue-100", "bg-blue-200", "bg-blue-300", "bg-blue-400", "bg-blue-500", "bg-blue-700"],
  1: ["bg-red-100", "bg-red-200", "bg-red-300", "bg-red-400", "bg-red-500", "bg-red-700"],
  2: ["bg-green-100", "bg-green-200", "bg-green-300", "bg-green-400", "bg-green-500", "bg-green-700"],
  3: ["bg-yellow-100", "bg-yellow-200", "bg-yellow-300", "bg-yellow-400", "bg-yellow-500", "bg-yellow-600"],
};

function textClass(camp: Camp, level: number): string {
  // 高濃度は可読性のため、青/赤/緑は白、黄は黒
  if (level >= 4) return camp === 3 ? "text-black" : "text-white";
  return "text-gray-900";
}

type Props = {
  warlords: Warlord[];
  onPick: (id: string) => void;
  ownedWarlords?: Record<string, number>; // warlordId -> 所持枚数
};

export function WarlordPalette({ warlords, onPick, ownedWarlords = {} }: Props) {
  // 陣営ごとにグループ化（参照: 06/3.3 - 1=魏 2=呉 3=蜀 4=群）
  const byCamp = CAMP_LABELS.map((_, campIndex) =>
    warlords.filter((w) => CAMP_ENUM_TO_INDEX[w.camp] === campIndex)
  );

  // 転置レイアウト: 左端に陣営ヘッダ、右側に7列までの武将を横並びにし、あふれたら段を増やす
  const MAX_COLS = 7; // 武将は1行最大7

  return (
    <div className="w-full h-full">
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
            <div className="py-2 px-1">
              <div className="grid gap-[4px]" aria-label="warlord-palette"
                style={{ gridTemplateColumns: `2ch repeat(${MAX_COLS}, 5ch)` }}
              >
                {byCamp.map((campWarlords, campIndex) => {
                  const rows = Math.max(1, Math.ceil(campWarlords.length / MAX_COLS));
                  const chunks: typeof campWarlords[] = [];
                  for (let r = 0; r < rows; r++) {
                    chunks.push(campWarlords.slice(r * MAX_COLS, r * MAX_COLS + MAX_COLS));
                  }

                  return (
                    <>
                      {/* 左端：陣営ヘッダ（自陣営の行数分にまたがる） */}
                      <div
                        key={`hdr-${campIndex}`}
                        className="flex items-center justify-center"
                        style={{ gridRow: `span ${rows}` }}
                      >
                        <div
                          className={`flex items-center justify-center text-[11px] font-medium rounded ${BG_CLASSES[campIndex as Camp][5]} ${campIndex === 3 ? "text-black" : "text-white"}`}
                          style={{ width: "2ch", height: `${rows * 24}px` }}
                        >
                          {CAMP_LABELS[campIndex]}
                        </div>
                      </div>

                      {/* 右側：武将 7 列まで */}
                      {chunks.map((chunk, rowIdx) => (
                        <>
                          {Array.from({ length: MAX_COLS }).map((_, col) => {
                            const warlord = chunk[col];
                            if (!warlord) {
                              return <div key={`empty-${campIndex}-${rowIdx}-${col}`} className="h-[20px]" />;
                            }

                            const owned = ownedWarlords[warlord.id] !== undefined;
                            const copies = ownedWarlords[warlord.id] || 0;
                            const limitBreak = Math.min(5, Math.max(0, copies - 1));
                            const textColor = owned ? textClass(campIndex as Camp, limitBreak) : "text-gray-400";
                            const bg = owned ? BG_CLASSES[campIndex as Camp][limitBreak] : "bg-white";
                            const name = warlord.name;
                            const fontSize = name.length >= 5 ? 10 : 12; // 5文字以上は縮小

                            return (
                              <button
                                key={`cell-${campIndex}-${rowIdx}-${col}`}
                                className={`relative border rounded flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${bg}`}
                                style={{ height: 20 }}
                                onClick={() => onPick(warlord.id)}
                                aria-label={`${name}${owned ? `（${limitBreak}凸）` : "（未所持）"}を選択`}
                              >
                                <span
                                  className={`leading-none ${textColor}`}
                                  style={{ width: "5ch", fontSize, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden" }}
                                  title={`${name}${owned ? ` (${limitBreak}凸)` : " (未所持)"}`}
                                >
                                  {name}
                                </span>
                              </button>
                            );
                          })}
                        </>
                      ))}
                    </>
                  );
                })}
              </div>
            </div>
          </TransformComponent>
        )}
      </TransformWrapper>
    </div>
  );
}


