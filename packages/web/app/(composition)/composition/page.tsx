"use client";
import { Suspense } from "react";

export default function CompositionPage() {
  return (
    <div className="h-[calc(100vh-100px)] grid md:grid-cols-2" aria-label="composition-builder" role="main">
      <div className="border-r p-2 overflow-hidden" aria-label="canvas-area">
        <div className="w-full h-full flex items-center justify-center text-gray-400 border rounded">
          {/* TODO: CompositionCanvas (参照: 03/2, 03/12.2) */}
          Canvas Placeholder
        </div>
      </div>
      <div className="p-2 overflow-hidden" aria-label="palette-area">
        {/* TODO: PaletteTabs + PaletteList（参照: 03/3） */}
        <div className="h-10 border-b flex items-center px-2">Palette Tabs</div>
        <Suspense fallback={<div className="p-2 text-sm text-gray-400">Loading...</div>}>
          <div className="h-full overflow-auto divide-y">
            {/* TODO: items virtualization（参照: 03/3） */}
            <div className="p-3">Item</div>
            <div className="p-3">Item</div>
            <div className="p-3">Item</div>
          </div>
        </Suspense>
      </div>
    </div>
  );
}

