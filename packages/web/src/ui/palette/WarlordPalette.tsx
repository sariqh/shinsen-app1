import type { Warlord } from "@/src/schema/warlord";

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

  const maxRows = Math.max(...byCamp.map((c) => c.length));

  return (
    <div className="h-full overflow-auto p-1">
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gridTemplateRows: `20px repeat(${maxRows}, 32px)`, // 行間を詰めて同時表示数を増加
        }}
        aria-label="warlord-palette"
      >
        {/* ヘッダー行（陣営名） */}
        {CAMP_LABELS.map((label, i) => (
          <div key={`hdr-${label}`} style={{ gridColumn: i + 1, gridRow: 1 }}>
            <div
              className={`h-[20px] flex items-center justify-center text-[11px] font-medium ${
                BG_CLASSES[i as Camp][5]
              } ${i === 3 ? "text-black" : "text-white"}`}
            >
              {label}
            </div>
          </div>
        ))}

        {/* 武将セル */}
        {byCamp.map((campWarlords, campIndex) =>
          campWarlords.map((warlord, rowIndex) => {
            // 参照: 06/3.2.2 - 疎Map（未所持はキー無し）
            const owned = ownedWarlords[warlord.id] !== undefined;
            const copies = ownedWarlords[warlord.id] || 0;
            // 参照: 06/3.2.2 - 凸（limit_break）は所持枚数から算出: min(5, max(0, copies - 1))
            const limitBreak = Math.min(5, Math.max(0, copies - 1));

            return (
              <button
                key={`c${campIndex}-r${rowIndex}`}
                style={{ gridColumn: campIndex + 1, gridRow: rowIndex + 2 }}
                className={`relative border rounded flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${
                  owned ? BG_CLASSES[campIndex as Camp][limitBreak] : "bg-white"
                }`}
                onClick={() => onPick(warlord.id)}
                aria-label={`${warlord.name}${owned ? `（${limitBreak}凸）` : "（未所持）"}を選択`}
              >
                <span
                  className={`text-[12px] leading-none truncate max-w-[90%] ${
                    owned ? textClass(campIndex as Camp, limitBreak) : "text-gray-400"
                  }`}
                  title={`${warlord.name}${owned ? ` (${limitBreak}凸)` : " (未所持)"}`}
                >
                  {warlord.name}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}


