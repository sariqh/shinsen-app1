export default function MyPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4" aria-label="mypage">
      <h1 className="text-xl font-semibold">マイページ</h1>
      <div className="border rounded p-4 space-y-2">
        <div className="text-sm">エクスポート</div>
        <div className="flex gap-2">
          <button className="border rounded px-3 py-2 text-sm" aria-label="export-image">画像</button>
          <button className="border rounded px-3 py-2 text-sm" aria-label="export-csv">CSV</button>
        </div>
        {/* TODO: export_image|csv イベント送信（参照: 03/12.5, 04/6） */}
      </div>
    </div>
  );
}

