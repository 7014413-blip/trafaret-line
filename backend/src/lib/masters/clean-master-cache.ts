// Deletes cached size files of master layouts that no order used for 90 days (ТЗ §19); a used
// file is touched (master-cut.ts), so only forgotten sizes go. Empty article folders go too.

import fs from "node:fs/promises";
import path from "node:path";

export const MASTER_CACHE_DAYS = 90;

export async function cleanMasterCache(root: string, now: Date = new Date(), days: number = MASTER_CACHE_DAYS): Promise<string[]> {
  const limit = now.getTime() - days * 24 * 60 * 60 * 1000;
  const deleted: string[] = [];
  const articles = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  for (const article of articles) {
    if (!article.isDirectory()) continue;
    const folder = path.join(root, article.name);
    const files = await fs.readdir(folder, { withFileTypes: true }).catch(() => []);
    for (const file of files) {
      if (!file.isFile()) continue;
      const full = path.join(folder, file.name);
      const stat = await fs.stat(full).catch(() => null);
      if (stat && stat.mtimeMs < limit) {
        await fs.rm(full, { force: true });
        deleted.push(path.join(article.name, file.name));
      }
    }
    if (!(await fs.readdir(folder).catch(() => ["keep"])).length) await fs.rmdir(folder).catch(() => undefined);
  }
  return deleted;
}
