"use client";
export function PaletteList({ items, onPick }: { items: {id:string,label:string}[], onPick:(id:string)=>void }) {
  return (
    <div className="h-full overflow-auto">
      <ul className="divide-y">
        {items.length===0 && <li className="p-3 text-sm text-gray-500">（ここにマスター読み込みリストが入ります）</li>}
        {items.map(it=>(
          <li key={it.id} className="p-2 hover:bg-gray-50 cursor-pointer" onClick={()=>onPick(it.id)}>
            <div className="text-sm">{it.label}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}