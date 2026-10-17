// Addresses of review photos: the public one (published reviews only) and the admin one.

function backendUrl(): string {
  return (process.env.BACKEND_PUBLIC_URL ?? "http://localhost:9000").replace(/\/$/, "")
}

export function publicReviewPhotoUrl(file: string): string {
  return `${backendUrl()}/tl-media/reviews/${encodeURIComponent(file)}`
}

/** Relative: the admin runs on the backend address with its session cookie. */
export function adminReviewPhotoUrl(file: string): string {
  return `/admin/tl-reviews/photo/${encodeURIComponent(file)}`
}
