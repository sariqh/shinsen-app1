type Index3 = 0 | 1 | 2;
type Props = {
  labels: (string | null)[];
  activeIndex: Index3;
  onSelect: (i: Index3) => void;
  onClear: (i: Index3) => void;
};

export function WarlordColumn({ labels, activeIndex, onSelect, onClear }: Props) {
  return (
    <div className="space-y-2" aria-label="warlord-column">
      {[0,1,2].map((i) => {
        const idx = i as Index3;
        const label = labels[idx] ?? null;
        const isActive = activeIndex === idx;
        return (
          <div key={idx} className={`h-12 border rounded flex items-center justify-between px-2 text-sm ${isActive ? "ring-2 ring-blue-400" : ""}`}>
            <button
              className="flex-1 text-left truncate"
              aria-pressed={isActive}
              onClick={() => onSelect(idx)}
            >
              {label ?? "空きスロット"}
            </button>
            {label && (
              <button
                className="ml-2 px-2 py-1 text-xs border rounded"
                onClick={() => onClear(idx)}
                aria-label={`スロット${idx+1}をクリア`}
              >
                クリア
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

