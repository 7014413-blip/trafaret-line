// Cut of one size of a catalogue product from its master layouts, through the size cache:
//   <cache>/<article>/<size>_<w>x<h>mm_<hash>.json        the cut regions of every piece
//   <cache>/<article>/<size>_<w>x<h>mm_<hash>-<n>.svg/.dxf the sheet ready for the machine
// The hash covers the master addresses, the sheet and the picture box, so a new master or a
// changed size builds a new file. A cached size is touched on every use: the cleaning job
// deletes only files nobody used for 90 days (clean-master-cache.ts).

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pictureBoxMm } from "../../shared/lib/catalog/picture-box";
import { toLayeredDxf, toLayeredSvg } from "../../shared/lib/export/layers";
import type { CatalogLineSource, MasterCut, MasterCutResult, MasterPiece } from "../../types/masters";
import { fetchMasterSvg } from "./fetch-master";
import { masterToCut } from "./master-to-cut";
import { articleOf, mastersCacheDir } from "./masters-dir";

/** Raised when the tracing changes, so old cache files are not used. */
const ALGORITHM = "trace-v1";

const safe = (value: string) => value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "size";

async function touch(files: string[]): Promise<void> {
  const now = new Date();
  await Promise.all(files.map((file) => fs.utimes(file, now, now).catch(() => undefined)));
}

export async function masterCut(
  source: CatalogLineSource,
  readMaster: (url: string) => Promise<string> = fetchMasterSvg,
  root: string = mastersCacheDir(),
): Promise<MasterCutResult> {
  if (!source.designUrls.length) throw new Error("the product has no master layout");
  const [sheetW, sheetH] = source.sheetMm;
  const box = pictureBoxMm(source.detail, source.sheetMm);
  const article = articleOf(source.handle);
  const hash = createHash("sha256")
    .update(JSON.stringify([ALGORITHM, source.designUrls, source.sheetMm, box]))
    .digest("hex")
    .slice(0, 10);
  const folder = path.join(root, article);
  const base = `${safe(source.sizeCode)}_${Math.round(sheetW)}x${Math.round(sheetH)}mm_${hash}`;
  const jsonFile = path.join(folder, `${base}.json`);
  const pieceFiles = (count: number) => Array.from({ length: count }, (_, i) => [
    path.join(folder, `${base}-${i + 1}.svg`), path.join(folder, `${base}-${i + 1}.dxf`),
  ]).flat();

  const cached = await fs.readFile(jsonFile, "utf8").then((text) => JSON.parse(text) as MasterCut).catch(() => null);
  if (cached) {
    const files = [jsonFile, ...pieceFiles(cached.pieces.length)];
    await touch(files);
    return { cut: cached, fromCache: true, files };
  }

  const sheet = { widthMm: sheetW, heightMm: sheetH };
  const pieces: MasterPiece[] = [];
  for (const url of source.designUrls) pieces.push(masterToCut(await readMaster(url), sheet, box));
  const cut: MasterCut = { article, sizeCode: source.sizeCode, sheet, pieces, builtAt: new Date().toISOString() };

  await fs.mkdir(folder, { recursive: true });
  const files = pieceFiles(pieces.length);
  await Promise.all(pieces.map(async (piece, i) => {
    const part = { sheet: { shape: "rect" as const, ...sheet }, cutPaths: piece.cutPaths, label: `${article} ${source.sizeLabel} #${i + 1}` };
    await fs.writeFile(files[2 * i], toLayeredSvg(part));
    await fs.writeFile(files[2 * i + 1], toLayeredDxf(part));
  }));
  // The JSON goes last: a cut is cached only when all its files are there.
  await fs.writeFile(jsonFile, JSON.stringify(cut));
  return { cut, fromCache: false, files: [jsonFile, ...files] };
}
