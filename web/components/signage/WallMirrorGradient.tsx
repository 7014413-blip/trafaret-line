// One light gradient across a whole set of mirror pieces (letters on a wall or a box lid), in the
// preview's own millimetres, so all pieces shine as one sheet.

export function WallMirrorGradient({ id, hex, width, height }: { id: string; hex: string; width: number; height: number }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2={height}>
      <stop offset="0" stopColor={hex} />
      <stop offset=".3" stopColor="#f8fafc" />
      <stop offset=".5" stopColor={hex} />
      <stop offset=".75" stopColor="#f8fafc" />
      <stop offset="1" stopColor={hex} />
    </linearGradient>
  );
}
