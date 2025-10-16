import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

type Props = {
  skills?: { id: string; name: string; type: string; owned: boolean }[];
  onPick: (id: string) => void;
};

// CSVから戦法データを生成
const SKILL_DATA: { id: string; name: string; type: string; owned: boolean }[] = [
  { id: "s_001", name: "白馬義従", type: "兵種", owned: false },
  { id: "s_002", name: "無當飛軍", type: "兵種", owned: true },
  { id: "s_003", name: "白耳兵", type: "兵種", owned: false },
  { id: "s_004", name: "大戟士", type: "兵種", owned: true },
  { id: "s_005", name: "藤甲兵", type: "兵種", owned: false },
  { id: "s_006", name: "陥陣営", type: "兵種", owned: false },
  { id: "s_007", name: "虎豹騎", type: "兵種", owned: true },
  { id: "s_008", name: "西涼鉄騎", type: "兵種", owned: false },
  { id: "s_009", name: "錦帆軍", type: "兵種", owned: true },
  { id: "s_010", name: "青州兵", type: "兵種", owned: false },
  { id: "s_011", name: "虎衛軍", type: "兵種", owned: true },
  { id: "s_012", name: "象兵", type: "兵種", owned: false },
  { id: "s_013", name: "先駆死士", type: "兵種", owned: false },
  { id: "s_014", name: "解煩兵", type: "兵種", owned: true },
  { id: "s_015", name: "丹陽兵", type: "兵種", owned: false },
  { id: "s_016", name: "飛熊軍", type: "兵種", owned: false },
  { id: "s_017", name: "魅惑", type: "パッシブ", owned: false },
  { id: "s_018", name: "合軍集衆", type: "パッシブ", owned: false },
  { id: "s_019", name: "兵無常勢", type: "パッシブ", owned: true },
  { id: "s_020", name: "刮目相待", type: "パッシブ", owned: true },
  { id: "s_021", name: "絶地反撃", type: "パッシブ", owned: true },
  { id: "s_022", name: "文武両道", type: "パッシブ", owned: true },
  { id: "s_023", name: "至善極地", type: "パッシブ", owned: false },
  { id: "s_024", name: "乗勝長駆", type: "パッシブ", owned: false },
  { id: "s_025", name: "気凌三軍", type: "パッシブ", owned: false },
  { id: "s_026", name: "太平道法", type: "パッシブ", owned: false },
  { id: "s_027", name: "虎踞鷹揚", type: "パッシブ", owned: true },
  { id: "s_028", name: "裸衣血戦", type: "パッシブ", owned: false },
  { id: "s_029", name: "剛勇無比", type: "パッシブ", owned: false },
  { id: "s_030", name: "引弦力戦", type: "パッシブ", owned: false },
  { id: "s_031", name: "士争先赴", type: "パッシブ", owned: false },
  { id: "s_032", name: "単騎千里", type: "パッシブ", owned: true },
  { id: "s_033", name: "血刃争奪", type: "パッシブ", owned: true },
  { id: "s_034", name: "衆妙奇計", type: "パッシブ", owned: true },
  { id: "s_035", name: "忠勇義烈", type: "パッシブ", owned: true },
  { id: "s_036", name: "整軍経武", type: "パッシブ", owned: true },
  { id: "s_037", name: "功不唐捐", type: "パッシブ", owned: true },
  { id: "s_038", name: "百騎劫営", type: "突撃", owned: true },
  { id: "s_039", name: "暴戻恣睢", type: "突撃", owned: false },
  { id: "s_040", name: "折衝禦侮", type: "突撃", owned: false },
  { id: "s_041", name: "克敵制勝", type: "突撃", owned: false },
  { id: "s_042", name: "一騎当千", type: "突撃", owned: false },
  { id: "s_043", name: "勇猛果断", type: "突撃", owned: true },
  { id: "s_044", name: "鬼神霆威", type: "突撃", owned: false },
  { id: "s_045", name: "速乗其利", type: "突撃", owned: true },
  { id: "s_046", name: "剣鋒破砕", type: "突撃", owned: false },
  { id: "s_047", name: "一致百慮", type: "突撃", owned: true },
  { id: "s_048", name: "八門金鎖", type: "陣法", owned: false },
  { id: "s_049", name: "鋒矢陣", type: "陣法", owned: true },
  { id: "s_050", name: "三勢陣", type: "陣法", owned: true },
  { id: "s_051", name: "箕形陣", type: "陣法", owned: false },
  { id: "s_052", name: "武鋒陣", type: "陣法", owned: true },
  { id: "s_053", name: "形一陣", type: "陣法", owned: false },
  { id: "s_054", name: "潜龍陣", type: "陣法", owned: false },
  { id: "s_055", name: "夢中弑臣", type: "指揮", owned: false },
  { id: "s_056", name: "義心昭烈", type: "指揮", owned: true },
  { id: "s_057", name: "舌戦群儒", type: "指揮", owned: false },
  { id: "s_058", name: "鈍兵挫鋭", type: "指揮", owned: false },
  { id: "s_059", name: "守而必固", type: "指揮", owned: false },
  { id: "s_060", name: "意気衝天", type: "指揮", owned: true },
  { id: "s_061", name: "暫避其鋒", type: "指揮", owned: false },
  { id: "s_062", name: "才気煥発", type: "指揮", owned: false },
  { id: "s_063", name: "神算鬼謀", type: "指揮", owned: false },
  { id: "s_064", name: "慰撫軍民", type: "指揮", owned: true },
  { id: "s_065", name: "整装雌伏", type: "指揮", owned: false },
  { id: "s_066", name: "奇計良謀", type: "指揮", owned: false },
  { id: "s_067", name: "横戈躍馬", type: "指揮", owned: false },
  { id: "s_068", name: "非攻制勝", type: "指揮", owned: true },
  { id: "s_069", name: "鉄騎駆馳", type: "指揮", owned: false },
  { id: "s_070", name: "志操堅固", type: "指揮", owned: true },
  { id: "s_071", name: "衆志成城", type: "指揮", owned: false },
  { id: "s_072", name: "赴湯踏火", type: "指揮", owned: false },
  { id: "s_073", name: "戦況見極", type: "指揮", owned: false },
  { id: "s_074", name: "剛柔一体", type: "指揮", owned: false },
  { id: "s_075", name: "韜心惑敵", type: "指揮", owned: true },
  { id: "s_076", name: "万夫不当", type: "アクティブ", owned: false },
  { id: "s_077", name: "破陣砕堅", type: "アクティブ", owned: true },
  { id: "s_078", name: "臥薪嘗胆", type: "アクティブ", owned: false },
  { id: "s_079", name: "千軍一掃", type: "アクティブ", owned: false },
  { id: "s_080", name: "万矢斉射", type: "アクティブ", owned: false },
  { id: "s_081", name: "四面楚歌", type: "アクティブ", owned: true },
  { id: "s_082", name: "杯中蛇影", type: "アクティブ", owned: false },
  { id: "s_083", name: "沈砂決水", type: "アクティブ", owned: false },
  { id: "s_084", name: "誘敵深入", type: "アクティブ", owned: false },
  { id: "s_085", name: "燎原之火", type: "アクティブ", owned: false },
  { id: "s_086", name: "風助火勢", type: "アクティブ", owned: true },
  { id: "s_087", name: "瞋目大喝", type: "アクティブ", owned: false },
  { id: "s_088", name: "兵鋒", type: "アクティブ", owned: false },
  { id: "s_089", name: "昏迷乱擾", type: "アクティブ", owned: true },
  { id: "s_090", name: "黄天太平", type: "アクティブ", owned: false },
  { id: "s_091", name: "傾国傾城", type: "アクティブ", owned: false },
  { id: "s_092", name: "即断即決", type: "アクティブ", owned: true },
  { id: "s_093", name: "刮骨療毒", type: "アクティブ", owned: false },
  { id: "s_094", name: "威謀必至", type: "アクティブ", owned: false },
  { id: "s_095", name: "形機軍略", type: "アクティブ", owned: false },
  { id: "s_096", name: "火熾原燎", type: "アクティブ", owned: false },
  { id: "s_097", name: "焚輜営塁", type: "アクティブ", owned: true },
  { id: "s_098", name: "結盟", type: "アクティブ", owned: false },
  { id: "s_099", name: "智計", type: "アクティブ", owned: false },
  { id: "s_100", name: "乗敵不慮", type: "アクティブ", owned: false },
  { id: "s_101", name: "竭力佐謀", type: "アクティブ", owned: false },
  { id: "s_102", name: "奇策妙計", type: "アクティブ", owned: false },
  { id: "s_103", name: "偽書疑心", type: "アクティブ", owned: true },
  { id: "s_104", name: "機変制勝", type: "アクティブ", owned: false },
  { id: "s_105", name: "破軍威勝", type: "アクティブ", owned: false },
  { id: "s_106", name: "疾風豪雨", type: "アクティブ", owned: false },
  { id: "s_107", name: "水路断截", type: "アクティブ", owned: false },
  { id: "s_108", name: "据水断橋", type: "アクティブ", owned: true },
  { id: "s_109", name: "撃其惰帰", type: "アクティブ", owned: false },
  { id: "s_110", name: "焔逐風飛", type: "アクティブ", owned: false },
  { id: "s_111", name: "決水潰城", type: "アクティブ", owned: false },
  { id: "s_112", name: "独行赴闘", type: "アクティブ", owned: true },
  { id: "s_113", name: "益其金鼓", type: "アクティブ", owned: false },
  { id: "s_114", name: "籠城自守", type: "アクティブ", owned: false },
  { id: "s_115", name: "奮戦力闘", type: "アクティブ", owned: false },
  { id: "s_116", name: "草船借箭", type: "アクティブ", owned: false },
  { id: "s_117", name: "上兵破謀", type: "アクティブ", owned: true },
  { id: "s_118", name: "掣刀斫敵", type: "アクティブ", owned: true },
  { id: "s_119", name: "臨鋒決闘", type: "アクティブ", owned: true },
  { id: "s_120", name: "衆望所帰", type: "アクティブ", owned: true },
  { id: "s_121", name: "投擲画戟", type: "アクティブ", owned: true },
  { id: "s_122", name: "万軍奪帥", type: "アクティブ", owned: false },
  { id: "s_123", name: "因利制権", type: "アクティブ", owned: false },
  { id: "s_124", name: "勠力同心", type: "アクティブ", owned: false },
];

const TYPE_LABELS = ["兵種", "パッシブ", "突撃", "陣法", "指揮", "アクティブ"] as const;
const TYPE_SHORT_LABELS = ["兵", "パ", "突", "陣", "指", "ア"] as const;

export function SkillPalette({ skills = SKILL_DATA, onPick }: Props) {
  const MAX_COLS = 6; // 1段最大6マス
  
  // 種類ごとにグループ化
  const byType = TYPE_LABELS.map((_, typeIndex) =>
    skills.filter((s) => s.type === TYPE_LABELS[typeIndex])
  );

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
              <div className="grid gap-[4px]" aria-label="skill-palette"
                style={{ gridTemplateColumns: `1ch repeat(${MAX_COLS}, 6ch)` }}
              >
                {byType.map((typeSkills, typeIndex) => {
                  if (typeSkills.length === 0) return null;
                  
                  const rows = Math.max(1, Math.ceil(typeSkills.length / MAX_COLS));
                  const chunks: typeof typeSkills[] = [];
                  for (let r = 0; r < rows; r++) {
                    chunks.push(typeSkills.slice(r * MAX_COLS, r * MAX_COLS + MAX_COLS));
                  }

                  return (
                    <>
                      {chunks.map((chunk, rowIdx) => (
                        <>
                          {/* 左端：種類ヘッダ（最初の段のみ表示） */}
                          <div key={`hdr-${typeIndex}-${rowIdx}`} className="flex items-center justify-center">
                            {rowIdx === 0 ? (
                              <div
                                className="h-[20px] flex items-center justify-center text-[11px] font-medium rounded bg-gray-600 text-white"
                                style={{ width: "1ch" }}
                              >
                                {TYPE_SHORT_LABELS[typeIndex]}
                              </div>
                            ) : (
                              <div className="h-[20px]" />
                            )}
                          </div>

                          {/* 右側：戦法 6 列まで */}
                          {Array.from({ length: MAX_COLS }).map((_, col) => {
                            const skill = chunk[col];
                            if (!skill) {
                              return <div key={`empty-${typeIndex}-${rowIdx}-${col}`} className="h-[20px]" />;
                            }

                            const bg = skill.owned ? "bg-blue-200" : "bg-white";
                            const textColor = skill.owned ? "text-blue-900" : "text-gray-400";
                            const name = skill.name;
                            const fontSize = name.length >= 5 ? 10 : 12; // 5文字以上は縮小

                            return (
                              <button
                                key={`cell-${typeIndex}-${rowIdx}-${col}`}
                                className={`relative border rounded flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${bg}`}
                                style={{ height: 20 }}
                                onClick={() => onPick(skill.id)}
                                aria-label={`${name}${skill.owned ? "（所持）" : "（未所持）"}を選択`}
                              >
                                <span
                                  className={`leading-none ${textColor}`}
                                  style={{ width: "6ch", fontSize, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden" }}
                                  title={`${name}${skill.owned ? " (所持)" : " (未所持)"}`}
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


