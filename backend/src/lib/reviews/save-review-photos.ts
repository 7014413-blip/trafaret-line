// Writes the cleaned photos of a review as "<review id>-<n>.<ext>" and returns the names;
// a photo that is not a JPEG or PNG is skipped.

import fs from "node:fs/promises"
import path from "node:path"
import { cleanReviewPhoto } from "./clean-review-photo"
import { reviewPhotosDir } from "./review-photos-dir"

export async function saveReviewPhotos(reviewId: string, photos: Buffer[], root: string = reviewPhotosDir()): Promise<string[]> {
  await fs.mkdir(root, { recursive: true })
  const names: string[] = []
  for (const photo of photos) {
    const clean = cleanReviewPhoto(photo)
    if (!clean) continue
    const name = `${reviewId}-${names.length + 1}.${clean.ext}`
    await fs.writeFile(path.join(root, name), clean.data)
    names.push(name)
  }
  return names
}
