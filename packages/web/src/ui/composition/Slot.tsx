type Props = { label: string };
export function Slot({ label }: Props) {
  return (
    <button className="h-12 border rounded w-full text-sm" aria-label={label}>
      {label}
    </button>
  );
}

