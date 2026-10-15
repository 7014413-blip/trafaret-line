// First page of a PDF picked as a logo, drawn to a PNG for the constructor preview. The PDF
// itself goes to the shop unchanged; this picture is only for the screen. pdf.js loads on demand,
// so the constructor stays light until a PDF is picked.

const MAX_SIDE_PX = 1400;

export interface PdfPreview {
  url: string;
  aspect: number;
}

export async function renderPdfPreview(file: File): Promise<PdfPreview> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
  try {
    const page = await doc.getPage(1);
    const unscaled = page.getViewport({ scale: 1 });
    const scale = MAX_SIDE_PX / Math.max(unscaled.width, unscaled.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no canvas");
    // A PDF page has no transparency: the white paper is dropped by the preview tint (dark = cut).
    await page.render({ canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("empty page"))), "image/png"));
    return { url: URL.createObjectURL(blob), aspect: canvas.width / canvas.height };
  } finally {
    await doc.destroy();
  }
}
