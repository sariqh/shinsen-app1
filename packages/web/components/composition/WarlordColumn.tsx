"use client";
import { useState } from "react";

function Slot({title}:{title:string}) {
  return (
    <div className="rounded-lg border p-2 min-h-12">
      <div className="text-[11px] text-gray-500 mb-1">{title}</div>
      <div className="h-7 bg-gray-100 rounded" />
    </div>
  )
}

export function WarlordColumn({index}:{index:number}) {
  const [name, setName] = useState<string>("");
  return (
    <div className="rounded-xl border p-2 flex flex-col gap-2 bg-white">
      <div className="text-xs font-semibold text-gray-600">武将 {index+1}</div>
      <div className="rounded-lg border p-2 min-h-14 flex items-center justify-between">
        <div className="text-sm">{name || "（未選択）"}</div>
        <button className="text-xs px-2 py-1 rounded border" onClick={()=>setName("サンプル武将")}>割当</button>
      </div>
      <Slot title="戦法 1" />
      <Slot title="戦法 2" />
      <Slot title="兵法書 1" />
      <Slot title="兵法書 2" />
      <Slot title="兵法書 3" />
      <Slot title="属性メモ" />
      <Slot title="装備メモ" />
      <Slot title="メモ" />
    </div>
  )
}