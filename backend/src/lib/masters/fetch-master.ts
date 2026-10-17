// Reads a master layout SVG by its address (product metadata.design_files, the file storage of
// the shop). Only http(s), 20 seconds and 25 MB at most, and the answer must be an SVG.

const TIMEOUT_MS = 20_000;
const MAX_BYTES = 25 * 1024 * 1024;

export async function fetchMasterSvg(url: string): Promise<string> {
  if (!/^https?:\/\//i.test(url)) throw new Error(`master layout address is not http(s): ${url}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`master layout HTTP ${response.status}`);
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_BYTES) throw new Error("master layout is larger than 25 MB");
    const text = await response.text();
    if (text.length > MAX_BYTES) throw new Error("master layout is larger than 25 MB");
    if (!/<svg[\s>]/i.test(text.slice(0, 4096))) throw new Error("master layout is not an SVG");
    return text;
  } finally {
    clearTimeout(timer);
  }
}
