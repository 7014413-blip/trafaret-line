// Heading of a constructor form: a small kicker, the title and a lead paragraph.

export function ConstructorHeader({ kicker, title, lead, children }: {
  kicker: string;
  title: string;
  lead: string;
  /** Extra lines under the lead (links to related constructors). */
  children?: React.ReactNode;
}) {
  return (
    <header>
      <p className="m-0 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{kicker}</p>
      <h1 className="m-0 mt-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,34px)] font-bold leading-tight">{title}</h1>
      <p className="mt-1.5 mb-0 text-[var(--muted)]">{lead}</p>
      {children}
    </header>
  );
}
