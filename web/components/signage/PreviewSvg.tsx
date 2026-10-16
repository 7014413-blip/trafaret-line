// SVG frame of a constructor preview: the view box in millimetres, the full width of the preview
// panel and an accessible name; the surface behind the design is set with style.

export function PreviewSvg({ viewBox, label, style, children }: {
  /** x, y, width, height of the view box, mm. */
  viewBox: [number, number, number, number];
  label: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <svg viewBox={viewBox.join(" ")} className="block h-auto max-h-[62vh] w-full" role="img" aria-label={label} style={style}>
      {children}
    </svg>
  );
}
