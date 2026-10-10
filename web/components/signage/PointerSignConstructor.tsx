"use client";

// «Табличка-вказівник» constructor (Денис 2026-10-10): a two-layer raised pointer sign.
// The customer changes the text lines and their fonts (shop fonts and their own), the base
// material and colour, the text colour, adds a logo and sets the direction of the tip and
// of the small arrow. Preview and price change at once; sizes in cm, prices in UAH only.
// Layout: lib/pointer-sign/layout.ts, price: lib/pointer-sign/price.ts (repeated on the server).

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { PlaqueLinesEditor } from "@/components/signage/PlaqueLinesEditor";
import { PointerMaterialPicker } from "@/components/signage/PointerMaterialPicker";
import { PointerSignPreview } from "@/components/signage/PointerSignPreview";
import { nextTierHint } from "@/lib/calculators/pricing";
import { readPlaqueSizeParam } from "@/lib/client/plaque-size-param";
import { LOGO_ACCEPT, readLogoFile } from "@/lib/client/read-logo-file";
import { uploadLayoutFile } from "@/lib/client/upload-layout-file";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { pointerThumbnailSvg } from "@/lib/export/pointer-thumbnail";
import { formatUAH } from "@/lib/format";
import { checkPointerSign } from "@/lib/pointer-sign/check";
import { clampPointerSizeMm } from "@/lib/pointer-sign/clamp-size";
import { DEFAULT_POINTER_SIGN_CONFIG } from "@/lib/pointer-sign/config";
import { findPointerMaterial } from "@/lib/pointer-sign/find-material";
import { computePointerLayout } from "@/lib/pointer-sign/layout";
import { pricePointerSign } from "@/lib/pointer-sign/price";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";
import { useCart } from "@/store/cart-store";
import type {
  PointerArrowPlacement, PointerDirection, PointerLogo, PointerSignDesign, PointerTextLine,
} from "@/types/pointer-sign";

const CFG = DEFAULT_POINTER_SIGN_CONFIG;
const FIRST_LINES: PointerTextLine[] = [
  { text: "КАВʼЯРНЯ", fontId: "roboto-slab", size: 1.3 },
  { text: "ВХІД З ДВОРУ", fontId: "rubik", size: 0.8 },
];
const ARROWS: [PointerArrowPlacement, string][] = [["start", "Перед текстом"], ["end", "Після тексту"], ["none", "Без стрілки"]];

type LogoState = Omit<PointerLogo, "uploadKey"> & { file: File; previewUrl: string; uploadKey: string | null };

const legend = "mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]";
const input = "h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none";

const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });

export function PointerSignConstructor() {
  const [sizeCode, setSizeCode] = useState(CFG.presets[0].code);
  const [customCm, setCustomCm] = useState({ w: 40, h: 15 });
  const [direction, setDirection] = useState<PointerDirection>(-1);
  const [baseId, setBaseId] = useState("black");
  const [overlayId, setOverlayId] = useState("white");
  const text = usePlaqueLines(FIRST_LINES, CFG.maxLines);
  const lines = text.lines;
  const [arrowPlacement, setArrowPlacement] = useState<PointerArrowPlacement>("start");
  const [arrowLine, setArrowLine] = useState(1);
  const [logo, setLogo] = useState<LogoState | null>(null);
  const [logoError, setLogoError] = useState("");
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<"idle" | "uploading" | "added" | "error">("idle");
  const [message, setMessage] = useState("");
  // Shipping date only in the browser: server and browser format weekdays differently.
  const [dispatch, setDispatch] = useState("виготовлення 3 робочі дні");
  const logoInput = useRef<HTMLInputElement>(null);
  const cart = useCart();

  useEffect(() => {
    setDispatch(formatDispatch(estimateDispatchDate(new Date())));
    const fromLink = readPlaqueSizeParam(CFG.presets.map((p) => p.code));
    if (fromLink) setSizeCode(fromLink);
  }, []);

  // Revoke the preview URL of a replaced or removed logo.
  const logoUrl = logo?.previewUrl ?? null;
  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl); }, [logoUrl]);

  const size = useMemo(() => {
    const preset = CFG.presets.find((p) => p.code === sizeCode);
    if (preset) return { widthMm: preset.widthMm, heightMm: preset.heightMm };
    return clampPointerSizeMm(customCm.w * 10, customCm.h * 10, CFG);
  }, [sizeCode, customCm]);

  const measured = text.measured;

  const design: PointerSignDesign = {
    sizeCode, widthMm: size.widthMm, heightMm: size.heightMm, direction,
    baseMaterialId: baseId, overlayMaterialId: overlayId,
    lines: lines.map((l) => ({ text: l.text.replace(/\s+/g, " ").trim(), fontId: l.fontId, size: l.size })),
    arrow: { placement: arrowPlacement, lineIndex: Math.min(arrowLine, Math.max(0, lines.length - 1)) },
    logo: logo ? { uploadKey: logo.uploadKey, fileName: logo.fileName, format: logo.format, aspect: logo.aspect, invert: logo.invert, ring: logo.ring } : null,
    quantity: qty,
  };

  const layout = computePointerLayout(design, measured.map((m) => m?.measure ?? null));
  const linePaths = new Map<number, string>();
  measured.forEach((m, i) => { if (m) linePaths.set(i, m.pathData); });
  const fontsReady = text.fontsReady;
  const checks = fontsReady ? checkPointerSign(design, layout, measured.map((m) => m?.missing ?? [])) : [];
  const errors = checks.filter((c) => c.level === "error");
  const price = pricePointerSign(design);
  const base = findPointerMaterial(baseId);
  const overlay = findPointerMaterial(overlayId);
  const hint = nextTierHint(qty);

  const onLineRemoved = (i: number) => setArrowLine((a) => (a > i ? a - 1 : a === i ? 0 : a));

  const pickLogo = async (file: File | undefined) => {
    setLogoError("");
    if (!file) return;
    const result = await readLogoFile(file);
    if (!result.ok) { setLogoError(result.error); return; }
    setLogo({ file: result.file, previewUrl: result.previewUrl, fileName: file.name, format: result.format, aspect: result.aspect, invert: false, ring: true, uploadKey: null });
  };

  const buy = async () => {
    if (errors.length || !fontsReady || state === "uploading") return;
    setMessage("");
    let uploadKey = logo?.uploadKey ?? null;
    if (logo && !uploadKey) {
      setState("uploading");
      try {
        uploadKey = await uploadLayoutFile(logo.file);
        setLogo((current) => (current && current.previewUrl === logo.previewUrl ? { ...current, uploadKey } : current));
      } catch (e) {
        setState("error");
        setMessage((e as Error).message || "Не вдалося завантажити логотип. Спробуйте ще раз.");
        return;
      }
    }
    const final: PointerSignDesign = { ...design, logo: design.logo ? { ...design.logo, uploadKey } : null };
    const texts = final.lines.map((l) => l.text).filter(Boolean).join(" / ");
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `pointer|${JSON.stringify({ ...final, quantity: 0 })}`,
      title: `Табличка-вказівник${texts ? ` «${texts}»` : ""}, ${cm(final.widthMm)}×${cm(final.heightMm)} см`,
      materialId: "acrylic_5",
      widthCm: final.widthMm / 10,
      heightCm: final.heightMm / 10,
      quantity: qty,
      kind: "pointer",
      pointer: final,
      basePrice: price.internal.basePrice,
      vectorSvg: pointerThumbnailSvg(layout, linePaths, base.hex, overlay.hex),
    });
    setState("added");
    setTimeout(() => setState("idle"), 1500);
  };

  const buyLabel = state === "uploading" ? "Завантажуємо логотип…" : state === "added" ? "✓ Додано в кошик" : "В кошик";
  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label="Превʼю таблички" className="self-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[#f3f1ec] lg:sticky lg:top-24">
        <PointerSignPreview layout={layout} linePaths={linePaths} base={base} overlay={overlay}
          logo={logo ? { url: logo.previewUrl, invert: logo.invert } : null} label={`Превʼю таблички-вказівника ${cm(size.widthMm)}×${cm(size.heightMm)} см`} />
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{cm(size.widthMm)} × {cm(size.heightMm)} см · вістря {direction === -1 ? "вліво" : "вправо"}</span>
          <span>{base.name.uk} {base.baseThicknessMm} мм + {overlay.name.uk.toLowerCase()} {overlay.overlayThicknessMm} мм</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <header>
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Конструктор вказівників</p>
          <h1 className="m-0 mt-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,34px)] font-bold leading-tight">Табличка-стрілка обʼємна, у два шари</h1>
          <p className="mt-1.5 mb-0 text-[var(--muted)]">Напишіть свій текст, оберіть шрифт, кольори й напрямок. Усі матеріали й кольори вже в ціні.</p>
        </header>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Розмір</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CFG.presets.map((p) => (
              <button key={p.code} id={`ps-size-${p.code}`} type="button" aria-pressed={sizeCode === p.code} onClick={() => setSizeCode(p.code)}
                className={`grid min-h-14 gap-0.5 rounded-xl border-[1.5px] px-2 py-1.5 tabular-nums ${sizeCode === p.code ? "border-[2px] border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
                <b className="text-[15px]">{cm(p.widthMm)}×{cm(p.heightMm)} см</b>
                <span className="text-[13px] text-[var(--muted)]">{formatUAH(p.price)}</span>
              </button>
            ))}
            <button id="ps-size-custom" type="button" aria-pressed={sizeCode === "custom"} onClick={() => setSizeCode("custom")}
              className={`grid min-h-14 gap-0.5 rounded-xl border-[1.5px] px-2 py-1.5 ${sizeCode === "custom" ? "border-[2px] border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
              <b className="text-[15px]">Свій розмір</b>
              <span className="text-[13px] text-[var(--muted)]">ціна одразу</span>
            </button>
          </div>
          {sizeCode === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-sm text-[var(--muted)]">Ширина, см
                <input id="ps-w" type="number" inputMode="decimal" step={0.5} min={CFG.minWidthMm / 10} max={CFG.maxWidthMm / 10} value={customCm.w}
                  onChange={(e) => setCustomCm((c) => ({ ...c, w: Number(e.target.value) || 0 }))}
                  onBlur={() => setCustomCm({ w: size.widthMm / 10, h: size.heightMm / 10 })} className={input} />
              </label>
              <label className="grid gap-1 text-sm text-[var(--muted)]">Висота, см
                <input id="ps-h" type="number" inputMode="decimal" step={0.5} min={CFG.minHeightMm / 10} max={CFG.maxHeightMm / 10} value={customCm.h}
                  onChange={(e) => setCustomCm((c) => ({ ...c, h: Number(e.target.value) || 0 }))}
                  onBlur={() => setCustomCm({ w: size.widthMm / 10, h: size.heightMm / 10 })} className={input} />
              </label>
              <span className="col-span-2 text-[13px] text-[var(--muted)]">
                Від {cm(CFG.minWidthMm)} до {cm(CFG.maxWidthMm)} см завширшки, висота не більше {Math.round(CFG.maxHeightToWidth * 100)}% ширини. Більша вивіска: <Link href="/vyvisky" className="underline">конструктор вивісок</Link>.
              </span>
            </div>
          )}
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Куди показує стрілка</legend>
          <div className="flex flex-wrap gap-2">
            <PlaqueChip id="ps-dir-left" on={direction === -1} onClick={() => setDirection(-1)}>← Вліво</PlaqueChip>
            <PlaqueChip id="ps-dir-right" on={direction === 1} onClick={() => setDirection(1)}>Вправо →</PlaqueChip>
          </div>
          <span className="text-[13px] text-[var(--muted)]">Вістря таблички і маленька стрілка в тексті показують в один бік.</span>
        </fieldset>

        <PlaqueLinesEditor state={text} legend="Напис" idPrefix="ps" maxChars={CFG.maxLineChars} onRemove={onLineRemoved}
          capByLine={new Map(layout.lines.map((l) => [l.index, l.capMm]))} />

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Маленька стрілка в тексті</legend>
          <div className="flex flex-wrap gap-2">{ARROWS.map(([v, name]) => <PlaqueChip key={v} id={`ps-arrow-${v}`} on={arrowPlacement === v} onClick={() => setArrowPlacement(v)}>{name}</PlaqueChip>)}</div>
          {arrowPlacement !== "none" && lines.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {lines.map((_, i) => <PlaqueChip key={i} id={`ps-arrow-line-${i}`} on={design.arrow.lineIndex === i} onClick={() => setArrowLine(i)}>У рядку {i + 1}</PlaqueChip>)}
            </div>
          )}
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Логотип</legend>
          <input ref={logoInput} id="ps-logo" type="file" accept={LOGO_ACCEPT} className="sr-only" onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ""; }} />
          {logo ? (
            <div className="grid gap-2 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-3">
              <div className="flex items-center justify-between gap-2">
                <b className="min-w-0 truncate text-sm">{logo.fileName}</b>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => logoInput.current?.click()} className="h-9 rounded-full border border-[var(--line)] px-3 text-sm">Замінити</button>
                  <button type="button" onClick={() => setLogo(null)} className="h-9 rounded-full border border-[var(--line)] px-3 text-sm">Прибрати</button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="ps-logo-ring" checked={logo.ring} onChange={(e) => setLogo({ ...logo, ring: e.target.checked })} className="accent-[var(--ink)]" />Коло навколо логотипа</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="ps-logo-invert" checked={logo.invert} onChange={(e) => setLogo({ ...logo, invert: e.target.checked })} className="accent-[var(--ink)]" />Світлий логотип на темному фоні</label>
              <span className="text-[13px] text-[var(--muted)]">Логотип виріжемо з того ж матеріалу, що й напис. Перед порізкою надішлемо макет на погодження.</span>
            </div>
          ) : (
            <button type="button" onClick={() => logoInput.current?.click()}
              className="grid justify-items-center gap-1 rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--card)] p-5 text-center">
              <b>Додати логотип</b>
              <span className="text-[13px] text-[var(--muted)]">SVG, PNG або JPG до 10 МБ, без доплати</span>
            </button>
          )}
          {logoError && <p role="alert" className="m-0 text-sm text-[var(--danger)]">{logoError}</p>}
        </fieldset>

        <PointerMaterialPicker legend="Основа" value={baseId} onChange={setBaseId} idPrefix="ps-base" />
        <PointerMaterialPicker legend="Колір напису і логотипа" value={overlayId} onChange={setOverlayId} idPrefix="ps-over" />

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Кількість</legend>
          <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Менше" onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">−</button>
            <input id="ps-qty" type="number" min={1} max={9999} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(9999, Math.round(Number(e.target.value)) || 1)))} aria-label="Кількість" className="h-10 w-16 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
            <button type="button" aria-label="Більше" onClick={() => setQty(Math.min(9999, qty + 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">+</button>
          </div>
          <span className="text-[13px] text-[var(--muted)]">Від 10 шт −5%, від 50 шт −10%, від 100 шт −15%.{hint ? ` Додайте ще ${hint.addQty} шт., щоб отримати −${Math.round(hint.nextDiscount * 100)}%.` : ""}</span>
        </fieldset>

        {checks.length > 0 && (
          <ul className="m-0 grid list-none gap-1 rounded-xl bg-[var(--surface)] p-3 text-sm">
            {checks.map((c, i) => <li key={i} className={c.level === "error" ? "text-[var(--danger)]" : "text-[var(--muted)]"}>{c.message.uk}</li>)}
          </ul>
        )}

        <div className="grid gap-2 rounded-2xl bg-[var(--surface)] p-4">
          <ul className="m-0 grid list-none gap-0.5 p-0 text-[13px] text-[var(--muted)]">
            {price.lines.map((l, i) => <li key={i}>{l.label}</li>)}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[30px] font-extrabold leading-none tabular-nums">{formatUAH(price.total)}
              <small className="mt-1 block text-[13px] font-normal text-[var(--muted)]">{qty > 1 ? `${formatUAH(price.unitPrice)} × ${qty} шт. · ` : ""}{price.needsManager ? "менеджер підтвердить строк" : dispatch}</small>
            </div>
            <button type="button" onClick={buy} disabled={errors.length > 0 || !fontsReady || state === "uploading"} className="h-[52px] rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] disabled:opacity-40">{buyLabel}</button>
          </div>
          {message && <p role="alert" className="m-0 text-sm text-[var(--danger)]">{message}</p>}
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--bg)] px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] lg:hidden">
        <b className="text-xl tabular-nums">{formatUAH(price.total)}</b>
        <button type="button" onClick={buy} disabled={errors.length > 0 || !fontsReady || state === "uploading"} className="h-12 rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] disabled:opacity-40">{buyLabel}</button>
      </div>
    </div>
  );
}
