// Deletes photo files of a review (the review was deleted, or the manager removed a photo).

import fs from "node:fs/promises"
import path from "node:path"
import { parseReviewPhotoName, reviewPhotosDir } from "./review-photos-dir"

export async function deleteReviewPhotos(files: string[], root: string = reviewPhotosDir()): Promise<void> {
  await Promise.all(files.filter((file) => parseReviewPhotoName(file)).map((file) => fs.rm(path.join(root, file), { force: true })))
}
