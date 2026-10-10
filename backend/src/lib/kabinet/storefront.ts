// Storefront address for «Відкрити на сайті» links in the cabinet and for clearing the
// storefront catalogue cache after a save.

export function storefrontUrl(): string {
  return (process.env.STOREFRONT_URL ?? "http://localhost:3100").replace(/\/$/, "")
}

/**
 * Asks the storefront to drop its 5-minute catalogue cache, so a saved product shows at
 * once. Best effort: the cache also expires by itself.
 */
export async function refreshStorefrontCatalog(): Promise<void> {
  const token = process.env.INTERNAL_API_TOKEN?.trim()
  if (!token) return
  try {
    await fetch(`${storefrontUrl()}/api/revalidate/catalog`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Storefront offline: the cache expires within 5 minutes anyway.
  }
}
