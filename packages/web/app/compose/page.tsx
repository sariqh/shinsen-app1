"use client";
import { useState } from "react";
import { PaletteTabs } from "@/components/palette/PaletteTabs";
import { PaletteList } from "@/components/palette/PaletteList";
import { CompositionCanvas } from "@/components/composition/CompositionCanvas";

export default function ComposePage() {
  const [tab, setTab] = useState<"warlord"|"skill"|"tactics">("warlord");
  return (
    <div className="h-[calc(100vh-100px)] grid md:grid-cols-2">
      <div className="border-r p-2 overflow-hidden">
        <CompositionCanvas />
      </div>
      <div className="p-2 overflow-hidden">
        <PaletteTabs value={tab} onChange={setTab} />
        <div className="h-full overflow-auto">
          <PaletteList items={[]} onPick={(id)=>{}} />
        </div>
      </div>
    </div>
  );
}