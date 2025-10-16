"use client";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

type TacticItem = {
  id: string;
  name: string;
  category: number;
};

type Props = {
  tactics: TacticItem[];
  onSelectTactic?: (tacticId: string) => void;
};

// カテゴリ別のラベル（2文字表示）
const CATEGORY_LABELS: Record<number, string> = {
  1: "作戦",
  2: "虚実", 
  3: "軍形",
  4: "九変",
  5: "始計",
  6: "用間",
};

// 兵法書カテゴリ別の背景色
const CATEGORY_COLORS: Record<number, string> = {
  1: "#B52323", // 作戦
  2: "#8B3ACD", // 虚実
  3: "#2A6FAD", // 軍形
  4: "#36A34A", // 九変
  5: "#C8A437", // 始計
  6: "#8A7B60", // 用間
};

export function TacticsPalette({ tactics, onSelectTactic }: Props) {
  const MAX_COLS = 7; // 1段最大7マス
  
  // カテゴリ別にグループ化
  const tacticsByCategory = tactics.reduce((acc, tactic) => {
    if (!acc[tactic.category]) {
      acc[tactic.category] = [];
    }
    acc[tactic.category].push(tactic);
    return acc;
  }, {} as Record<number, TacticItem[]>);

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
              <div className="grid gap-[4px]" aria-label="tactics-palette"
                style={{ gridTemplateColumns: `2ch repeat(${MAX_COLS}, 6ch)` }}
              >
                {Object.entries(tacticsByCategory)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([category, categoryTactics]) => {
                    const categoryNum = Number(category);
                    const categoryLabel = CATEGORY_LABELS[categoryNum] || "未";
                    
                    const rows = Math.max(1, Math.ceil(categoryTactics.length / MAX_COLS));
                    const chunks: TacticItem[] = [];
                    for (let r = 0; r < rows; r++) {
                      chunks.push(categoryTactics.slice(r * MAX_COLS, r * MAX_COLS + MAX_COLS));
                    }

                    return (
                      <>
                        {/* 左端：カテゴリヘッダ（全行にまたがる） */}
                        <div 
                          key={`hdr-${category}`}
                          className="flex items-center justify-center"
                          style={{ gridRow: `span ${rows}` }}
                        >
                          <div
                            className="flex items-center justify-center text-[11px] font-medium rounded text-white"
                            style={{ 
                              width: "2ch",
                              height: `${rows * 24}px`, // 20px + 4px gap
                              writingMode: "vertical-rl",
                              textOrientation: "upright",
                              backgroundColor: CATEGORY_COLORS[categoryNum],
                            }}
                          >
                            {categoryLabel}
                          </div>
                        </div>

                        {/* 右側：兵法書マス */}
                        {chunks.map((chunk, rowIdx) => (
                          <>
                            {Array.from({ length: MAX_COLS }).map((_, col) => {
                              const tactic = chunk[col];
                              if (!tactic) {
                                return <div key={`empty-${category}-${rowIdx}-${col}`} className="h-[20px]" />;
                              }

                              const bg = "bg-gray-100"; // 所持概念なし
                              const textColor = "text-gray-800";
                              const name = tactic.name;
                              const fontSize = name.length >= 5 ? 10 : 12; // 5文字以上は縮小

                              return (
                                <button
                                  key={`cell-${category}-${rowIdx}-${col}`}
                                  className={`relative border rounded flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${bg}`}
                                  style={{ height: 20 }}
                                  onClick={() => onSelectTactic?.(tactic.id)}
                                  aria-label={`${name}を選択`}
                                >
                                  <span
                                    className={`leading-none ${textColor}`}
                                    style={{ width: "6ch", fontSize, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden" }}
                                    title={name}
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
