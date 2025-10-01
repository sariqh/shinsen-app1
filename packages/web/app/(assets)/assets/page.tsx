"use client";
import { useMemo, useState } from "react";

type Camp = 0|1|2|3; // 0:魏(青) 1:呉(赤) 2:蜀(緑) 3:群(黄) — 表示順

// 未所持は白、0..5 凸は白→濃色(700相当: 黄のみ600)へ段階（等間隔近似）
const BG_CLASSES: Record<Camp, string[]> = {
  // index: 凸数（0..5）。未所持は別扱いで bg-white
  0: ["bg-blue-100","bg-blue-200","bg-blue-300","bg-blue-400","bg-blue-500","bg-blue-700"],
  1: ["bg-red-100","bg-red-200","bg-red-300","bg-red-400","bg-red-500","bg-red-700"],
  2: ["bg-green-100","bg-green-200","bg-green-300","bg-green-400","bg-green-500","bg-green-700"],
  3: ["bg-yellow-100","bg-yellow-200","bg-yellow-300","bg-yellow-400","bg-yellow-500","bg-yellow-600"],
};

function textClass(camp: Camp, v: number, owned: boolean): string {
  if (!owned) return "text-gray-900";
  // 高濃度は可読性のため、青/赤/緑は白、黄は黒
  if (v >= 4) return camp === 3 ? "text-black" : "text-white";
  return "text-gray-900";
}

function hashTo凸(name: string): 0|1|2|3|4|5 {
  let h = 0; for (let i=0;i<name.length;i++) h = (h*31 + name.charCodeAt(i))|0;
  const v = Math.abs(h) % 6; return v as 0|1|2|3|4|5;
}

// CSV（参照: sample/武将図鑑リスト.csv）。2形式を許容：
// - 形式A: ヘッダが 陣営列（例: 魏,群,呉,蜀）で、各セルに武将名
// - 形式B: ヘッダが 武将名,陣営,所持,凸数
const CSV = `武将名,陣営,所持,凸数\n王異,魏,,\n典韋,魏,○,0\n許褚,魏,,\n張郃,魏,○,1\n徐晃,魏,,\n夏侯惇,魏,,\n龐徳,魏,○,2\n鍾会,魏,,\n曹純,魏,,\n于禁,魏,,\n楽進,魏,,\n鄧艾,魏,○,3\n夏侯淵,魏,,\n曹仁,魏,,\n曹操,魏,,\n程昱,魏,,\n郭嘉,魏,,\nCO曹丕,魏,,\nCO甄氏,魏,,\n張遼,魏,,\n司馬懿,魏,○,4\n王元姫,魏,○,5\n張春華,魏,○,0\n荀攸,魏,○,1\n賈詡,魏,,\n郝昭,魏,,\n王双,魏,,\n満寵,魏,,\nSP荀彧,魏,,\nSP郭嘉,魏,,\nCO曹丕,魏,,\nSP許褚,魏,,\nSP曹真,魏,,\nSP龐徳,魏,,\nSP劉曄,魏,,\n周瑜,呉,○,2\n甘寧,呉,○,3\n孫堅,呉,○,4\n黄蓋,呉,○,5\n程普,呉,○,0\n孫策,呉,○,1\n陸遜,呉,○,2\n呂蒙,呉,,\n孫権,呉,,\n太史慈,呉,,\n馬忠,呉,,\n陸抗,呉,,\n孫尚香,呉,○,3\n凌統,呉,,\n魯粛,呉,○,4\nCO朱然,呉,,\nSP周瑜,呉,,\n周泰,呉,,\nSP呂蒙,呉,○,5\n諸葛恪,呉,,\nSP孫堅,呉,,\n馬超,蜀,,\n陳到,蜀,,\n黄忠,蜀,○,0\n趙雲,蜀,,\n王平,蜀,○,1\n徐庶,蜀,,\n劉備,蜀,,\n張飛,蜀,,\n黄月英,蜀,○,2\n諸葛亮,蜀,,\n関羽,蜀,,\n法正,蜀,,\n魏延,蜀,○,3\nCO関平,蜀,,\nCO星彩,蜀,,\n馬雲騄,蜀,,\n龐統,蜀,,\n張氏,蜀,,\n伊籍,蜀,○,4\n厳顔,蜀,,\nSP諸葛亮,蜀,,\nSP関羽,蜀,,\n関銀屏,蜀,,\n関興,蜀,○,5\n張苞,蜀,,\nCO関平,蜀,○,0\n姜維,蜀,,\nSP黄月英,蜀,,\n孟獲,群,,\n于吉,群,,\n董卓,群,○,1\n田豊,群,,\n呂玲綺,群,○,2\n祝融,群,,\n兀突骨,群,,\n公孫瓚,群,,\n袁紹,群,○,3\n張角,群,,\n李儒,群,,\n高順,群,,\n馬騰,群,,\n文醜,群,○,4\n華雄,群,,\n顔良,群,,\n華佗,群,○,5\n左慈,群,,\n貂蝉,群,,\n蔡琰,群,○,0\n呂布,群,,\n許攸,群,,\n袁術,群,,\n高覧,群,○,1\n陳宮,群,,\n張譲,群,,\n木鹿大王,群,,\n沮授,群,,\nCO呂玲綺,群,,\n董白,群,,\n朶思大王,群,,\nSP馬超,群,○,2\n鄒氏,群,,\nSP朱儁,群,,\nSP袁紹,群,,\nSP張梁,群,,\n麹義,群,○,3\nSP皇甫嵩,群,,\nSP張宝,群,,\nSP貂蝉,群,,\nSP董卓,群,○,4`;

type Row = { name: string; campLabel: "魏"|"呉"|"蜀"|"群"; owned: boolean;凸: 0|1|2|3|4|5 };
function parseCSV(): Row[] {
  const lines = CSV.trim().split(/\n/).map(l=>l.split(","));
  const header = lines.shift()!;
  if (header.includes("武将名")) {
    // 形式B
    const idx = {
      name: header.indexOf("武将名"), camp: header.indexOf("陣営"), own: header.indexOf("所持"), lv: header.indexOf("凸数")
    };
    const toCamp = (s: string): "魏"|"呉"|"蜀"|"群" => (s as any);
    return lines.map(cols => {
      const name = (cols[idx.name]||"").trim();
      const camp = toCamp((cols[idx.camp]||"").trim() || "魏");
      const owned = /○/.test(cols[idx.own]||"");
      const lv = Math.max(0, Math.min(5, parseInt(cols[idx.lv]||"0",10)||0)) as 0|1|2|3|4|5;
      return { name, campLabel: camp, owned, 凸: lv };
    }).filter(r=>r.name);
  } else {
    // 形式A
    const idxOf = (label: string) => header.indexOf(label);
    const cols = ["魏","呉","蜀","群"] as const;
    const result: Row[] = [];
    for (const camp of cols) {
      for (const row of lines) {
        const name = (row[idxOf(camp)]||"").trim();
        if (!name) continue;
        // 所持/凸は不明 → 所持扱い + 凸はダミー（0）
        result.push({ name, campLabel: camp, owned: true, 凸: 0 });
      }
    }
    return result;
  }
}

function buildGridData() {
  const rows = parseCSV();
  const order = ["魏","呉","蜀","群"] as const;
  const perCamp = order.map(lbl => rows.filter(r=>r.campLabel===lbl));
  // 空行は生成しない（未所持は name はあり owned=false として扱う想定）
  const colsData = perCamp;
  const maxRows = Math.max(0, ...colsData.map(c => c.length));
  return { cols: order, colsData, maxRows };
}

function WarlordCell({ name,凸, camp, owned }: { name: string; 凸: number; camp: Camp; owned: boolean }) {
  return (
    <div className={`relative border rounded flex items-center justify-center ${owned? BG_CLASSES[camp][凸] : "bg-white"}`}>
      <span className={`text-[12px] leading-none truncate max-w-[90%] ${textClass(camp, 凸, owned)}`} title={name}>{name || "\u00A0"}</span>
    </div>
  );
}

export default function AssetsPage() {
  const [tab, setTab] = useState<"warlord"|"skill">("warlord");
  const grid = useMemo(()=>buildGridData(), []);
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4" aria-label="assets-page">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">図鑑（所持）</h1>
        <div className="flex gap-2" role="tablist" aria-label="assets-tabs">
          <button role="tab" aria-selected={tab==="warlord"} className={`px-3 py-1.5 text-sm border rounded ${tab==="warlord"?"bg-gray-100":""}`} onClick={()=>setTab("warlord")}>武将</button>
          <button role="tab" aria-selected={tab==="skill"} className={`px-3 py-1.5 text-sm border rounded ${tab==="skill"?"bg-gray-100":""}`} onClick={()=>setTab("skill")}>戦法</button>
        </div>
      </div>

      {tab==="warlord" ? (
        <div className="overflow-hidden" style={{ height: "calc(100vh - 120px)" }}>
          <div
            className="grid gap-0.5"
            style={{
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gridTemplateRows: `20px repeat(${grid.maxRows}, 1fr)`,
            }}
            aria-label="warlord-grid"
          >
            {/* 陣営ヘッダ（別行を確保し、以降のセルは +1 オフセット） */}
            {grid.cols.map((label, i) => (
              <div key={`hdr-${label}`} style={{ gridColumn: i+1, gridRow: 1 }}>
                <div className={`h-[20px] flex items-center justify-center text-[11px] font-medium ${BG_CLASSES[i as Camp][5]} ${i===3?"text-black":"text-white"}`}>
                  {label}
                </div>
              </div>
            ))}
            {/* 本体セル（ヘッダ分 1 行ずらす） */}
            {grid.colsData.map((col, campIndex) => (
              col.map((row, rowIndex) => (
                <div key={`c${campIndex}-r${rowIndex}`} style={{ gridColumn: campIndex+1, gridRow: rowIndex+2 }}>
                  <WarlordCell name={row?.name||""} 凸={row?.凸??0} camp={campIndex as Camp} owned={!!row?.owned} />
                </div>
              ))
            ))}
          </div>
        </div>
      ) : (
        <div className="border rounded p-3 min-h-32 text-sm text-gray-500" aria-label="skills-owned">戦法は後ほど</div>
      )}

      <p className="text-xs text-gray-500">{/* TODO: 所持トグル/保存はナビゲーション境界時にAPI（参照: 04/4.2, 06/2.3） */}</p>
    </div>
  );
}

