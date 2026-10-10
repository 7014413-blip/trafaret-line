import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import type { ExecArgs, Logger } from "@medusajs/framework/types"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import type { UploadedFile, UploadedFiles } from "../../types/catalog"

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
}

/**
 * Uploads catalogue files through the configured File Module.
 * A file whose content hash matches the one remembered in metadata is not uploaded again.
 */
export class FileUploader {
  private readonly cache = new Map<string, UploadedFile>()

  constructor(
    private readonly container: ExecArgs["container"],
    private readonly catalogDir: string,
    private readonly logger: Logger
  ) {}

  /** Uploads a file that must exist (path relative to CATALOG_DIR). */
  async upload(relativePath: string, known: UploadedFiles = {}): Promise<UploadedFile> {
    const absolute = path.join(this.catalogDir, relativePath)
    if (!fs.existsSync(absolute)) {
      throw new Error(`Catalogue file not found: ${absolute}`)
    }
    return this.uploadExisting(relativePath, absolute, known)
  }

  /** Uploads a file that may be absent (videos); returns null and logs a warning when it is missing. */
  async uploadOptional(relativePath: string | null, known: UploadedFiles = {}): Promise<{ path: string; file: UploadedFile } | null> {
    if (!relativePath) {
      return null
    }
    const absolute = path.join(this.catalogDir, relativePath)
    if (!fs.existsSync(absolute)) {
      this.logger.warn(`Optional catalogue file not found, skipped: ${relativePath}`)
      return null
    }
    return { path: relativePath, file: await this.uploadExisting(relativePath, absolute, known) }
  }

  private async uploadExisting(relativePath: string, absolute: string, known: UploadedFiles): Promise<UploadedFile> {
    const cached = this.cache.get(relativePath)
    if (cached) {
      return cached
    }
    const content = fs.readFileSync(absolute)
    const sha1 = crypto.createHash("sha1").update(content).digest("hex")
    const previous = known[relativePath]
    if (previous && previous.sha1 === sha1) {
      this.cache.set(relativePath, previous)
      return previous
    }
    const ext = path.extname(absolute).toLowerCase()
    const mimeType = MIME[ext]
    if (!mimeType) {
      throw new Error(`Unsupported file type ${ext} for ${relativePath}`)
    }
    const { result } = await uploadFilesWorkflow(this.container).run({
      input: {
        files: [
          {
            filename: path.basename(absolute),
            mimeType,
            content: content.toString("binary"),
            access: "public",
          },
        ],
      },
    })
    const uploaded: UploadedFile = { sha1, url: result[0].url }
    this.cache.set(relativePath, uploaded)
    this.logger.debug(`Uploaded ${relativePath} → ${uploaded.url}`)
    return uploaded
  }
}

/** Reads metadata.catalog_files written by an earlier import, or an empty map. */
export function knownFiles(metadata: Record<string, unknown> | null | undefined): UploadedFiles {
  const value = metadata?.catalog_files
  if (!value || typeof value !== "object") {
    return {}
  }
  const files: UploadedFiles = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (entry && typeof entry === "object" && typeof (entry as UploadedFile).sha1 === "string" && typeof (entry as UploadedFile).url === "string") {
      files[key] = { sha1: (entry as UploadedFile).sha1, url: (entry as UploadedFile).url }
    }
  }
  return files
}
