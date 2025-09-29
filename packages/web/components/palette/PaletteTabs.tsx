"use client";
type Tab = "warlord" | "skill" | "tactics";
export function PaletteTabs({ value, onChange }: { value: Tab, onChange: (v:Tab)=>void }) {
  const tabs: {k:Tab, label:string}[] = [
    {k:"warlord", label:"武将"},
    {k:"skill", label:"戦法"},
    {k:"tactics", label:"兵法書"},
  ];
  return (
    <div className="flex gap-2 mb-2">
      {tabs.map(t=>(
        <button key={t.k}
          onClick={()=>onChange(t.k)}
          className={`px-3 py-1.5 rounded-full border text-sm ${value===t.k?"bg-gray-900 text-white":"bg-white hover:bg-gray-50"}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}