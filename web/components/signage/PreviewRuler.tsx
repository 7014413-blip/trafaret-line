// Ruler under a constructor preview (10 cm or 5 cm) so the customer sees the real size.

export function PreviewRuler({ y, lengthMm, ink, stroke, tick, fontSize, textY }: {
  /** Top of the ruler in the preview, mm. */
  y: number;
  lengthMm: number;
  ink: string;
  stroke: number;
  /** Half height of the end ticks, mm. */
  tick: number;
  fontSize: number;
  /** Baseline of the label under the ruler, mm. */
  textY: number;
}) {
  return (
    <g transform={`translate(0 ${y})`} fill={ink} stroke={ink}>
      <line x1="0" y1="0" x2={lengthMm} y2="0" strokeWidth={stroke} />
      <line x1="0" y1={-tick} x2="0" y2={tick} strokeWidth={stroke} />
      <line x1={lengthMm} y1={-tick} x2={lengthMm} y2={tick} strokeWidth={stroke} />
      <text x={lengthMm / 2} y={textY} textAnchor="middle" fontSize={fontSize} stroke="none">{lengthMm / 10} см</text>
    </g>
  );
}
