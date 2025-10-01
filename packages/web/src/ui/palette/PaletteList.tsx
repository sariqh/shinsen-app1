type Props = { items: { id: string; name: string }[]; onPick: (id: string) => void };
export function PaletteList({ items, onPick }: Props) {
  return (
    <div role="list" aria-label="warlord-catalog" className="grid grid-cols-2 gap-2 p-2">
      {items.map((it)=> (
        <button key={it.id} className="border rounded p-3 text-left hover:bg-gray-50" onClick={()=>onPick(it.id)} aria-label={it.name}>
          <div className="text-sm font-medium truncate">{it.name}</div>
          {/* 追加情報は将来（陣営/兵種/レア度など） */}
        </button>
      ))}
    </div>
  );
}

