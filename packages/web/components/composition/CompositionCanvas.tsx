"use client";
import { useState } from "react";
import { WarlordColumn } from "./WarlordColumn";

export function CompositionCanvas(){
  const [scale, setScale] = useState(1);
  return (
    <div className="h-full w-full rounded-xl border overflow-hidden relative">
      <div className="absolute right-2 top-2 z-10 flex gap-2">
        <button className="px-2 py-1 rounded border" onClick={()=>setScale(s=>Math.max(0.75, s-0.25))}>-</button>
        <button className="px-2 py-1 rounded border" onClick={()=>setScale(1)}>100%</button>
        <button className="px-2 py-1 rounded border" onClick={()=>setScale(s=>Math.min(1.25, s+0.25))}>+</button>
      </div>
      <div className="h-full w-full grid grid-cols-3 gap-2 p-2" style={{ transform:`scale(${scale})`, transformOrigin:"top left" }}>
        <WarlordColumn index={0}/>
        <WarlordColumn index={1}/>
        <WarlordColumn index={2}/>
      </div>
    </div>
  );
}