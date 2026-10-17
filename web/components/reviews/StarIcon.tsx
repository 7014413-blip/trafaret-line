// One star filled from the left by `fill` (0–1) in the text colour.

const STAR = "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z";

export function StarIcon({ fill, size }: { fill: number; size: number }) {
  const part = Math.max(0, Math.min(1, fill));
  const id = `star-fill-${Math.round(part * 100)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id}>
          <stop offset={part} stopColor="currentColor" />
          <stop offset={part} stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={STAR} fill={`url(#${id})`} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
