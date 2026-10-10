// Copies the constructor fonts (cyrillic + latin WOFF) from @fontsource into
// public/fonts and checks that every font has the Ukrainian letters. The fonts of the
// wedding monograms (lib/monogram/styles.ts) go to a separate manifest, so they do not
// appear in the constructor's font list.
// Run: node scripts/copy-fonts.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import opentype from "opentype.js";

export const FONTS = [
  { id: "montserrat", pkg: "montserrat", weight: 800, name: "Montserrat", group: "Без засічок" },
  { id: "oswald", pkg: "oswald", weight: 600, name: "Oswald", group: "Без засічок" },
  { id: "rubik", pkg: "rubik", weight: 700, name: "Rubik", group: "Без засічок" },
  { id: "comfortaa", pkg: "comfortaa", weight: 700, name: "Comfortaa", group: "Без засічок" },
  { id: "playfair", pkg: "playfair-display", weight: 700, name: "Playfair Display", group: "Класичні" },
  { id: "lora", pkg: "lora", weight: 700, name: "Lora", group: "Класичні" },
  { id: "roboto-slab", pkg: "roboto-slab", weight: 700, name: "Roboto Slab", group: "Класичні" },
  { id: "marck", pkg: "marck-script", weight: 400, name: "Marck Script", group: "Рукописні" },
  { id: "caveat", pkg: "caveat", weight: 700, name: "Caveat", group: "Рукописні" },
  { id: "bad-script", pkg: "bad-script", weight: 400, name: "Bad Script", group: "Рукописні" },
  { id: "lobster", pkg: "lobster", weight: 400, name: "Lobster", group: "Рукописні" },
  { id: "pacifico", pkg: "pacifico", weight: 400, name: "Pacifico", group: "Рукописні" },
];

export const MONOGRAM_FONTS = [
  { id: "mono-playfair", pkg: "playfair-display", weight: 400, style: "normal", name: "Playfair Display", group: "Монограма" },
  { id: "mono-playfair-italic", pkg: "playfair-display", weight: 400, style: "italic", name: "Playfair Display Italic", group: "Монограма" },
  { id: "mono-lora", pkg: "lora", weight: 500, style: "normal", name: "Lora", group: "Монограма" },
  { id: "mono-marck", pkg: "marck-script", weight: 400, style: "normal", name: "Marck Script", group: "Монограма" },
];

const MUST = "ЇїЄєҐґІіЙйЩщЮюЯяЖж0123456789&";
const out = join(process.cwd(), "public", "fonts");
mkdirSync(out, { recursive: true });
const manifest = [];
const monogramManifest = [];

for (const f of [...FONTS, ...MONOGRAM_FONTS]) {
  const files = [];
  for (const subset of ["cyrillic", "latin"]) {
    const src = join("node_modules", "@fontsource", f.pkg, "files", `${f.pkg}-${subset}-${f.weight}-${f.style ?? "normal"}.woff`);
    const dst = `${f.id}-${subset}.woff`;
    copyFileSync(src, join(out, dst));
    files.push(dst);
  }
  const fonts = files.map((n) => {
    const b = readFileSync(join(out, n));
    return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  });
  const missing = [...MUST].filter((ch) => !fonts.some((ft) => ft.charToGlyphIndex(ch) > 0));
  console.log(`${f.name.padEnd(18)} ${missing.length ? "MISSING " + missing.join("") : "ok"}`);
  if (!missing.length) (MONOGRAM_FONTS.includes(f) ? monogramManifest : manifest).push({ id: f.id, name: f.name, group: f.group, files });
}

writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
writeFileSync(join(out, "monogram-manifest.json"), JSON.stringify(monogramManifest, null, 2));
console.log(`fonts ok: ${manifest.length}/${FONTS.length}, monogram fonts ok: ${monogramManifest.length}/${MONOGRAM_FONTS.length}`);
