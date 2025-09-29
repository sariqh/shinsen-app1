export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div role="toolbar" className="h-10 border-b flex items-center gap-2 px-2">
      {children}
    </div>
  );
}

