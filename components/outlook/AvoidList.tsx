export function AvoidList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-[color:var(--color-red)]/20 bg-[color:var(--color-red-light)] p-4 text-sm text-[color:var(--color-red)]"
        >
          {item}
        </div>
      ))}
    </div>
  );
}
