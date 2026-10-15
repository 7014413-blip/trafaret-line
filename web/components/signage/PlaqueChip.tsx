// Pill button of the plaque constructors (direction, arrow place, colours by name).

export function PlaqueChip({ on, onClick, children, id }: { on: boolean; onClick: () => void; children: React.ReactNode; id?: string }) {
  return (
    <button id={id} type="button" aria-pressed={on} onClick={onClick}
      className={`min-h-10 rounded-full border-[1.5px] px-3.5 text-sm tabular-nums ${on ? "border-[var(--ink)] bg-[var(--surface)] font-bold" : "border-[var(--line)] bg-[var(--card)]"}`}>{children}</button>
  );
}
