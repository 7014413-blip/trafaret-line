// Reads a logo picked in a constructor: checks the type and size, returns a preview URL and
// the picture's proportions. SVG files are shown through <image>, where their scripts never run;
// the server checks the file again on upload (backend lib/upload-check.ts).

export const LOGO_ACCEPT = ".svg,.png,.jpg,.jpeg";
export const MAX_LOGO_BYTES = 10 * 1024 * 1024;

export type LogoFileResult =
  | { ok: true; file: File; previewUrl: string; aspect: number; format: "svg" | "raster" }
  | { ok: false; error: string };

function svgAspect(source: string): number | null {
  const viewBox = /viewBox\s*=\s*["']\s*([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([\d.eE]+)[\s,]+([\d.eE]+)\s*["']/.exec(source);
  if (viewBox) {
    const w = Number(viewBox[3]);
    const h = Number(viewBox[4]);
    if (w > 0 && h > 0) return w / h;
  }
  const w = parseFloat(/<svg[^>]*\swidth\s*=\s*["']([\d.]+)/i.exec(source)?.[1] ?? "");
  const h = parseFloat(/<svg[^>]*\sheight\s*=\s*["']([\d.]+)/i.exec(source)?.[1] ?? "");
  return w > 0 && h > 0 ? w / h : null;
}

function imageAspect(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => (image.naturalWidth > 0 && image.naturalHeight > 0 ? resolve(image.naturalWidth / image.naturalHeight) : reject(new Error("empty image")));
    image.onerror = () => reject(new Error("broken image"));
    image.src = url;
  });
}

export async function readLogoFile(file: File): Promise<LogoFileResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["svg", "png", "jpg", "jpeg"].includes(ext)) return { ok: false, error: "Підходять файли SVG, PNG або JPG." };
  if (file.size > MAX_LOGO_BYTES) return { ok: false, error: "Файл більший за 10 МБ. Стисніть його або надішліть нам у Viber." };
  if (ext === "svg") {
    const source = await file.text();
    if (!/<svg[\s>]/i.test(source)) return { ok: false, error: "Файл SVG пошкоджений. Збережіть логотип ще раз." };
    const blob = new Blob([source], { type: "image/svg+xml" });
    const previewUrl = URL.createObjectURL(blob);
    const aspect = svgAspect(source) ?? (await imageAspect(previewUrl).catch(() => 1));
    return { ok: true, file, previewUrl, aspect, format: "svg" };
  }
  const previewUrl = URL.createObjectURL(file);
  try {
    return { ok: true, file, previewUrl, aspect: await imageAspect(previewUrl), format: "raster" };
  } catch {
    URL.revokeObjectURL(previewUrl);
    return { ok: false, error: "Не вдалося відкрити картинку. Спробуйте інший файл." };
  }
}
