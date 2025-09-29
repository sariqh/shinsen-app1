type Props = { items: { id: string; name: string }[]; onPick: (id: string) => void };
export function PaletteList({ items, onPick }: Props) {
  return (
    <ul role="listbox" aria-label="palette-list" className="divide-y">
      {items.map((it)=> (
        <li key={it.id} role="option">
          <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={()=>onPick(it.id)}>
            {it.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

