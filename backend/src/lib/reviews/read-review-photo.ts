// A stored review photo with its content type, or null when there is no such file.

import { readFile } from "node:fs/promises"
import path from "node:path"
import { parseReviewPhotoName, reviewPhotosDir } from "./review-photos-dir"

export async function readReviewPhoto(file: string, root: string = reviewPhotosDir()): Promise<{ data: Buffer; type: string } | null> {
  const name = parseReviewPhotoName(file)
  if (!name) return null
  const data = await readFile(path.join(root, file)).catch(() => null)
  return data ? { data, type: name.ext === "png" ? "image/png" : "image/jpeg" } : null
}
