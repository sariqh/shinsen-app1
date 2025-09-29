type Props = { id: string; name: string; onPick: (id: string) => void };
export function PaletteItem({ id, name, onPick }: Props) {
  return (
    <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={()=>onPick(id)} aria-label={name}>
      {name}
    </button>
  );
}

