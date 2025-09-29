"use client";
import { useComposerStore } from "@/src/stores/composer";

// 参照: 03/12.2 ズーム/パン 0.75/1.0/1.25（MVP）
export function CompositionCanvas() {
  const { scale, pan } = useComposerStore();
  return (
    <svg className="w-full h-full border rounded bg-white" viewBox="0 0 100 100" role="img" aria-label="composition-canvas">
      <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
        <rect x="10" y="10" width="80" height="80" fill="#f9fafb" stroke="#e5e7eb" />
        {/* TODO: スロット/配置（参照: 03/2） */}
        <text x="50" y="55" textAnchor="middle" fill="#9ca3af" fontSize="6">Canvas</text>
      </g>
    </svg>
  );
}

