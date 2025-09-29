export default function AssetsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4" aria-label="assets-page">
      <h1 className="text-xl font-semibold">図鑑（所持）</h1>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="border rounded p-3 min-h-32" aria-label="warlords-owned">Warlords Owned (Skeleton)</div>
        <div className="border rounded p-3 min-h-32" aria-label="skills-owned">Skills Owned (Skeleton)</div>
      </div>
      <p className="text-xs text-gray-500">{/* TODO: 所持トグル/保存はナビゲーション境界時にAPI（参照: 04/4.2, 06/2.3） */}</p>
    </div>
  );
}

