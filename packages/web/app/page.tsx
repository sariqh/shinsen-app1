export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">はじめに</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <a href="/assets" className="rounded-2xl border p-4 hover:bg-gray-50">
          <div className="font-semibold mb-2">A: 自分だけの図鑑を作る</div>
          <p className="text-sm text-gray-600">スクショから所持を読み取り</p>
        </a>
        <a href="/assets" className="rounded-2xl border p-4 hover:bg-gray-50">
          <div className="font-semibold mb-2">B: 手持ちを読み込ませて編成作成</div>
          <p className="text-sm text-gray-600">OCR完了後、編成へ</p>
        </a>
        <a href="/compose" className="rounded-2xl border p-4 hover:bg-gray-50">
          <div className="font-semibold mb-2">C: 読み込まずに編成作成</div>
          <p className="text-sm text-gray-600">お試しで編成UIへ</p>
        </a>
      </div>
    </div>
  )
}