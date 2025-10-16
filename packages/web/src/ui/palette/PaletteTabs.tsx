type Tab = "warlord" | "skill" | "tactics";
type Props = { value: Tab; onChange: (t: Tab) => void };
export function PaletteTabs({ value, onChange }: Props) {
  return (
    <div role="tablist" aria-label="palette-tabs" className="flex gap-1">
      {(["warlord","skill","tactics"] as Tab[]).map((t)=> (
        <button key={t} role="tab" aria-selected={value===t} onClick={()=>onChange(t as Tab)} className={`px-3 py-2 text-sm border rounded ${value===t?"bg-gray-100":""}`}>
          {t === "warlord" ? "武将" : t === "skill" ? "戦法" : "兵法書"}
        </button>
      ))}
    </div>
  );
}

