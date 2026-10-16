// Number of nodes in an ASCII DXF: the points (group codes 10 and 11) of the drawing's entities
// and block definitions. A LINE has two, every vertex of a polyline one, every control or fit
// point of a spline one. Header and table points are not drawing nodes and are skipped.
// Binary DXF has no text group codes: null, the file is then checked by its size only.

const DRAWING_SECTIONS = new Set(["BLOCKS", "ENTITIES"]);
const POINT_CODES = new Set(["10", "11"]);

export function dxfNodes(text: string): number | null {
  if (text.startsWith("AutoCAD Binary DXF")) return null;
  const lines = text.split(/\r?\n/);
  let section = "";
  let nodes = 0;
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = lines[i].trim();
    const value = lines[i + 1].trim();
    if (code === "0" && value === "ENDSEC") section = "";
    else if (code === "2" && lines[i - 1]?.trim() === "SECTION") section = value;
    else if (DRAWING_SECTIONS.has(section) && POINT_CODES.has(code)) nodes += 1;
  }
  return nodes;
}
