"use client";

// Business sign constructor (Денис 2026-10-10): shape, size, base sheet and thickness, text lines
// each with its own font, size and sheet, the customer's logo, a mirror frame, text along the
// edge of round signs, mounting holes with standoffs or self-adhesive backing, quantity.
// Preview and price at once; the customer sees sizes in cm and UAH, never m².
// Layout: lib/business-sign/layout.ts; price: lib/calculators/signage.ts (repeated on the server).

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BusinessSignPreview, type BusinessSignView } from "@/components/signage/BusinessSignPreview";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { PlaqueLinesEditor } from "@/components/signage/PlaqueLinesEditor";
import { SheetSwatches } from "@/components/signage/SheetSwatches";
import { DEFAULT_BUSINESS_SIGN_CONFIG } from "@/lib/business-sign/config";
import { computeBusinessSignLayout } from "@/lib/business-sign/layout";
import { measureArcText } from "@/lib/business-sign/measure-arc";
import { BUSINESS_SIGN_PALETTE, findBusinessSignSheet } from "@/lib/business-sign/palette";
import { businessSignToSignDesign } from "@/lib/business-sign/to-sign-design";
import { DEFAULT_SIGN_PRICING, checkSign, priceSign } from "@/lib/calculators/signage";
import { nextTierHint } from "@/lib/calculators/pricing";
import { SIGN_LOGO_ACCEPT, readSignLogoFile } from "@/lib/client/read-sign-logo-file";
import { uploadLayoutFile } from "@/lib/client/upload-layout-file";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { businessSignThumbnailSvg } from "@/lib/export/business-sign-thumbnail";
import { formatUAH } from "@/lib/format";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";
import { loadFont } from "@/lib/text/font-loader";
import { useCart } from "@/store/cart-store";
import type { BusinessSignDesign, BusinessSignLine, BusinessSignLogo, BusinessSignLogoPlace } from "@/types/business-sign";
import type { SignShape } from "@/types/signage";
import type { LoadedFont } from "@/types/text";

const CFG = DEFAULT_BUSINESS_SIGN_CONFIG;
const SHAPES: [SignShape, string][] = [["circle", "Коло"], ["rect", "Прямокутник"], ["rounded", "Заокруглений"], ["square", "Квадрат"], ["arrow", "Стрілка"], ["pointer", "Вказівник"]];
const PLACES: [BusinessSignLogoPlace, string][] = [["above", "Над текстом"], ["left", "Ліворуч від тексту"]];
const HOLES: [0 | 2 | 4, string][] = [[0, "Без отворів"], [2, "2 отвори з тримачами"], [4, "4 отвори з тримачами"]];
const legend = "mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]";
const input = "h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none";
const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });
const isSquare = (shape: SignShape) => shape === "circle" || shape === "square";
const sizeName = (shape: SignShape, w: number, h: number) => (shape === "circle" ? `Ø${cm(w)} см` : `${cm(w)}×${cm(isSquare(shape) ? w : h)} см`);

type LogoState = Omit<BusinessSignLogo, "fileName" | "format" | "aspect"> & { file: File; previewUrl: string; fileName: string; format: "svg" | "raster" | "pdf"; aspect: number; uploadKey: string | null };

export function BusinessSignConstructor() {
  const [shape, setShape] = useState<SignShape>("circle");
  const [widthMm, setWidthMm] = useState(500);
  const [heightMm, setHeightMm] = useState(500);
  const [widthInput, setWidthInput] = useState("50");
  const [heightInput, setHeightInput] = useState("50");
  const [direction, setDirection] = useState<-1 | 1>(1);
  const [baseId, setBaseId] = useState("black");
  const [thickness, setThickness] = useState(3);
  const [lineSheets, setLineSheets] = useState<string[]>(["mirror-gold", "white"]);
  const [frameId, setFrameId] = useState<string | null>("mirror-gold");
  const [arcOn, setArcOn] = useState(false);
  const [arcTop, setArcTop] = useState("");
  const [arcBottom, setArcBottom] = useState("");
  const [arcFontId, setArcFontId] = useState("pt-serif");
  const [arcSheet, setArcSheet] = useState("mirror-gold");
  const [arcFont, setArcFont] = useState<LoadedFont | null>(null);
  const [logo, setLogo] = useState<LogoState | null>(null);
  const [logoError, setLogoError] = useState("");
  const [holes, setHoles] = useState<0 | 2 | 4>(0);
  const [adhesive, setAdhesive] = useState(true);
  const [template, setTemplate] = useState(false);
  const [qty, setQty] = useState(1);
  const [view, setView] = useState<BusinessSignView>("close");
  const [logoDevelopment, setLogoDevelopment] = useState(false);
  const [logoBrief, setLogoBrief] = useState("");
  const [state, setState] = useState<"idle" | "uploading" | "added" | "error">("idle");
  const [message, setMessage] = useState("");
  // Shipping date only in the browser: server and browser format weekdays differently.
  const [dispatch, setDispatch] = useState("виготовлення 3 робочі дні");
  const logoInput = useRef<HTMLInputElement>(null);
  const fonts = usePlaqueLines([
    { text: "Мрія", fontId: "marck", size: 1.6 },
    { text: "САЛОН КРАСИ", fontId: "montserrat", size: 0.6 },
  ], CFG.maxLines);
  const cart = useCart();

  useEffect(() => setDispatch(formatDispatch(estimateDispatchDate(new Date()))), []);
  // Revoke the preview URL of a replaced or removed logo.
  const logoUrl = logo?.previewUrl ?? null;
  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl); }, [logoUrl]);

  // The edge text has its own font: shop fonts load from the manifest, the customer's are loaded already.
  const { allFonts, customFonts, fontFor } = fonts;
  useEffect(() => {
    const ready = fontFor(arcFontId) ?? customFonts.find((f) => f.id === arcFontId);
    if (ready) { setArcFont(ready); return; }
    const entry = allFonts.find((f) => f.id === arcFontId && !f.custom);
    if (!entry) return;
    let alive = true;
    loadFont(entry).then((font) => { if (alive) setArcFont(font); }).catch(() => undefined);
    return () => { alive = false; };
  }, [arcFontId, allFonts, customFonts, fontFor]);

  const lines: BusinessSignLine[] = fonts.lines.map((line, i) => ({ ...line, materialId: lineSheets[i] ?? lineSheets[0] ?? "mirror-gold" }));
  const round = shape === "circle";
  const design: BusinessSignDesign = {
    shape, widthMm, heightMm: isSquare(shape) ? widthMm : heightMm, direction,
    baseMaterialId: baseId, baseThicknessMm: thickness, lines,
    logo: logo ? { fileName: logo.fileName, format: logo.format, aspect: logo.aspect, share: logo.share, place: logo.place, invert: logo.invert, materialId: logo.materialId } : null,
    arc: round && arcOn ? { top: arcTop, bottom: arcBottom, fontId: arcFontId, materialId: arcSheet } : null,
    frameMaterialId: frameId, holes, selfAdhesive: adhesive, positioningStencil: template,
    logoDevelopment: !logo && logoDevelopment, logoBrief, quantity: qty,
  };

  const arcMeasures = useMemo(() => ({
    top: round && arcOn && arcFont ? measureArcText(arcFont, arcTop) : null,
    bottom: round && arcOn && arcFont ? measureArcText(arcFont, arcBottom) : null,
  }), [round, arcOn, arcFont, arcTop, arcBottom]);
  const layout = computeBusinessSignLayout(design, fonts.measured, arcMeasures, CFG);
  const linePaths = new Map<number, string>();
  fonts.measured.forEach((m, i) => { if (m) linePaths.set(i, m.pathData); });
  const sign = businessSignToSignDesign(design, layout);
  const price = priceSign(sign, BUSINESS_SIGN_PALETTE);
  const checks = checkSign(sign, BUSINESS_SIGN_PALETTE);
  const missing = [...new Set([...fonts.measured.flatMap((m) => m?.missing ?? []), ...layout.arcs.flatMap((a) => a.missing)])];
  const empty = !layout.lines.length && !layout.logo && !layout.arcs.length && !design.logoDevelopment;
  const errors = checks.filter((c) => c.level === "error");
  const canBuy = !empty && errors.length === 0 && fonts.fontsReady && state !== "uploading";
  const hint = nextTierHint(qty);
  const base = findBusinessSignSheet(baseId);
  const thicknesses = base.finish === "mirror" ? [2, 3] : [3, 6, 8];
  const capByLine = new Map(layout.lines.map((l) => [l.index, l.capMm]));

  const setSize = (w: number, h: number) => {
    const cw = Math.min(CFG.maxSideMm, Math.max(CFG.minSideMm, Math.round(w)));
    const ch = Math.min(CFG.maxSideMm, Math.max(CFG.minSideMm, Math.round(h)));
    setWidthMm(cw); setHeightMm(ch);
    setWidthInput(String(cw / 10)); setHeightInput(String(ch / 10));
  };
  const pickShape = (next: SignShape) => {
    setShape(next);
    const presets = CFG.presets[next];
    const preset = presets[Math.min(2, presets.length - 1)];
    setSize(preset.widthMm, preset.heightMm);
    if (next === "arrow" || next === "pointer") setFrameId(null);
  };
  const pickBase = (id: string) => {
    setBaseId(id);
    const sheet = findBusinessSignSheet(id);
    if (sheet.finish === "mirror" && thickness > 3) setThickness(3);
  };
  const onLineRemoved = (i: number) => setLineSheets((list) => list.filter((_, k) => k !== i));
  const setLineSheet = (i: number, id: string) => setLineSheets((list) => {
    const next = [...list];
    while (next.length <= i) next.push(next[next.length - 1] ?? "mirror-gold");
    next[i] = id;
    return next;
  });

  const pickLogo = async (file: File | undefined) => {
    setLogoError("");
    if (!file) return;
    const result = await readSignLogoFile(file);
    if (!result.ok) { setLogoError(result.error); return; }
    setLogo({
      file: result.file, previewUrl: result.previewUrl, fileName: file.name, format: result.format, aspect: result.aspect,
      share: 0.45, place: "above", invert: false, materialId: lineSheets[0] ?? "mirror-gold", uploadKey: null,
    });
  };

  const trySample = async () => {
    setLogoError("");
    try {
      const response = await fetch("/demo/sign-sample-logo.svg");
      if (!response.ok) throw new Error(String(response.status));
      const blob = await response.blob();
      await pickLogo(new File([blob], "pryklad-lohotypa.svg", { type: "image/svg+xml" }));
    } catch {
      setLogoError("Не вдалося завантажити приклад. Додайте свій логотип.");
    }
  };

  const buy = async () => {
    if (!canBuy) return;
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
    const texts = [...design.lines.map((l) => l.text.trim()), design.arc?.top.trim() ?? "", design.arc?.bottom.trim() ?? ""].filter(Boolean).join(" / ");
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `sign|${JSON.stringify({ ...design, quantity: 0 })}|${uploadKey ?? ""}`,
      title: `Вивіска${texts ? ` «${texts}»` : ""}${design.logo ? " з логотипом" : design.logoDevelopment ? ", розробка логотипа" : ""}, ${sizeName(shape, layout.widthMm, layout.heightMm)}`,
      materialId: "acrylic",
      widthCm: layout.widthMm / 10,
      heightCm: layout.heightMm / 10,
      quantity: qty,
      kind: "sign",
      sign: sign,
      fixedPrice: price.unitPrice,
      uploadKey: uploadKey ?? undefined,
      vectorSvg: businessSignThumbnailSvg(design, layout, linePaths),
    });
    setState("added");
    setTimeout(() => setState("idle"), 1500);
  };

  const fontOptions = allFonts.length
    ? allFonts.map((f) => <option key={f.id} value={f.id}>{f.custom ? `Ваш: ${f.name}` : f.name}</option>)
    : <option value={arcFontId}>Шрифти завантажуються…</option>;
  const buyLabel = state === "uploading" ? "Завантажуємо логотип…" : state === "added" ? "✓ Додано в кошик" : "В кошик";

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label="Превʼю вивіски" className="self-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[#f3f1ec] lg:sticky lg:top-24">
        <BusinessSignPreview design={design} layout={layout} linePaths={linePaths} logoUrl={logo?.previewUrl ?? null} view={view}
          label={`Превʼю вивіски ${sizeName(shape, layout.widthMm, layout.heightMm)}`} />
        <div className="flex gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 pt-2.5">
          <PlaqueChip id="bs-view-close" on={view === "close"} onClick={() => setView("close")}>Крупно</PlaqueChip>
          <PlaqueChip id="bs-view-wall" on={view === "wall"} onClick={() => setView("wall")}>На стіні</PlaqueChip>
        </div>
        <div className="flex flex-wrap justify-between gap-2 bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{sizeName(shape, layout.widthMm, layout.heightMm)}{layout.lines[0] ? ` · літери від ${cm(Math.min(...layout.lines.map((l) => l.capMm)))} см` : ""}</span>
          <span>{base.name.uk}, {thickness} мм</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <header>
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Конструктор вивісок</p>
          <h1 className="m-0 mt-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,34px)] font-bold leading-tight">3D акрилова бізнес-вивіска</h1>
          <p className="mt-1.5 mb-0 text-[var(--muted)]">Персоналізована вивіска з акрилу у два шари: основа і обʼємний напис, ваш логотип, дзеркальна рамка. Немає логотипа — розробимо індивідуально. Кругла від Ø30 см за 1 600 ₴.</p>
          <p className="mt-1.5 mb-0 text-sm"><Link href="/vyvisky/vkazivnyky" className="underline">Табличка-стрілка 25×10 см від 450 ₴ →</Link> · <Link href="/vyvisky/ofisni-tablychky" className="underline">Офісна табличка 21×6 см від 220 ₴ →</Link> · <Link href="/vyvisky/napysy-na-plantsi" className="underline">Написи на планці, меню з акрилу →</Link> · <Link href="/vyvisky/tablychky-poverkh" className="underline">Таблички поверхів →</Link> · <Link href="/vyvisky/tablychky-na-dveri" className="underline">Таблички на двері →</Link> · <Link href="/vyvisky/nomerky" className="underline">Номерки від 65 ₴ →</Link></p>
        </header>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Форма і розмір</legend>
          <div className="flex flex-wrap gap-2">{SHAPES.map(([v, name]) => <PlaqueChip key={v} id={`bs-shape-${v}`} on={shape === v} onClick={() => pickShape(v)}>{name}</PlaqueChip>)}</div>
          <div className="flex flex-wrap gap-2">
            {CFG.presets[shape].map((p) => (
              <PlaqueChip key={`${p.widthMm}x${p.heightMm}`} id={`bs-size-${p.widthMm}x${p.heightMm}`}
                on={widthMm === p.widthMm && (isSquare(shape) || heightMm === p.heightMm)} onClick={() => setSize(p.widthMm, p.heightMm)}>
                {sizeName(shape, p.widthMm, p.heightMm)}{shape === "circle" && DEFAULT_SIGN_PRICING.circlePresetPrices[p.widthMm] ? ` · ${formatUAH(DEFAULT_SIGN_PRICING.circlePresetPrices[p.widthMm])}` : ""}
              </PlaqueChip>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2">
            <label className="grid gap-1 text-sm text-[var(--muted)]">{round ? "Діаметр, см" : "Ширина, см"}
              <input id="bs-w" type="number" inputMode="decimal" min={CFG.minSideMm / 10} max={CFG.maxSideMm / 10} value={widthInput}
                onChange={(e) => { setWidthInput(e.target.value); const v = Number(e.target.value.replace(",", ".")); if (v > 0) setWidthMm(Math.min(CFG.maxSideMm, Math.max(CFG.minSideMm, Math.round(v * 10)))); }}
                onBlur={() => setWidthInput(String(widthMm / 10))} className={`${input} w-full min-w-0`} />
            </label>
            {!isSquare(shape) && (
              <label className="grid gap-1 text-sm text-[var(--muted)]">Висота, см
                <input id="bs-h" type="number" inputMode="decimal" min={CFG.minSideMm / 10} max={CFG.maxSideMm / 10} value={heightInput}
                  onChange={(e) => { setHeightInput(e.target.value); const v = Number(e.target.value.replace(",", ".")); if (v > 0) setHeightMm(Math.min(CFG.maxSideMm, Math.max(CFG.minSideMm, Math.round(v * 10)))); }}
                  onBlur={() => setHeightInput(String(heightMm / 10))} className={`${input} w-full min-w-0`} />
              </label>
            )}
          </div>
          {(shape === "arrow" || shape === "pointer") && (
            <div className="flex flex-wrap gap-2">
              <PlaqueChip id="bs-dir-left" on={direction === -1} onClick={() => setDirection(-1)}>← Ліворуч</PlaqueChip>
              <PlaqueChip id="bs-dir-right" on={direction === 1} onClick={() => setDirection(1)}>Праворуч →</PlaqueChip>
            </div>
          )}
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Основа</legend>
          <SheetSwatches sheets={BUSINESS_SIGN_PALETTE} value={baseId} onChange={pickBase} idPrefix="bs-base" label="Колір основи" />
          <div className="flex flex-wrap gap-2">
            {thicknesses.map((t) => <PlaqueChip key={t} id={`bs-thick-${t}`} on={thickness === t} onClick={() => setThickness(t)}>{t} мм{t > 3 ? " · доплата" : ""}</PlaqueChip>)}
          </div>
          <span className="text-[13px] text-[var(--muted)]">{base.name.uk}{base.inStock ? "" : " · під замовлення"}.</span>
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Логотип</legend>
          <input ref={logoInput} id="bs-logo" type="file" accept={SIGN_LOGO_ACCEPT} className="sr-only" onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ""; }} />
          {logo ? (
            <div className="grid min-w-0 gap-2 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-3">
              <div className="flex items-center justify-between gap-2">
                <b className="min-w-0 truncate text-sm">{logo.fileName}</b>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => logoInput.current?.click()} className="h-9 rounded-full border border-[var(--line)] px-3 text-sm">Замінити</button>
                  <button type="button" onClick={() => setLogo(null)} className="h-9 rounded-full border border-[var(--line)] px-3 text-sm">Прибрати</button>
                </div>
              </div>
              {layout.lines.length > 0 && (
                <>
                  <div className="flex flex-wrap gap-2">{PLACES.map(([v, name]) => <PlaqueChip key={v} id={`bs-logo-${v}`} on={logo.place === v} onClick={() => setLogo({ ...logo, place: v })}>{name}</PlaqueChip>)}</div>
                  <label className="grid gap-1 text-sm text-[var(--muted)]">Розмір логотипа
                    <input id="bs-logo-size" type="range" min={0.25} max={0.75} step={0.05} value={logo.share} onChange={(e) => setLogo({ ...logo, share: Number(e.target.value) })} className="accent-[var(--ink)]" />
                  </label>
                </>
              )}
              <span className="text-sm text-[var(--muted)]">Колір логотипа</span>
              <SheetSwatches sheets={BUSINESS_SIGN_PALETTE} value={logo.materialId} onChange={(id) => setLogo({ ...logo, materialId: id })} idPrefix="bs-logo-c" label="Колір логотипа" size="sm" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="bs-logo-invert" checked={logo.invert} onChange={(e) => setLogo({ ...logo, invert: e.target.checked })} className="accent-[var(--ink)]" />Світлий логотип на темному фоні</label>
              <span className="text-[13px] text-[var(--muted)]">{logo.format !== "svg"
                ? "Картинку переведемо у вектор і надішлемо макет на погодження перед порізкою. Логотип у кількох кольорах розкладемо по шарах."
                : "Перед порізкою надішлемо макет на погодження. Логотип у кількох кольорах розкладемо по шарах."}</span>
            </div>
          ) : (
            <button type="button" onClick={() => logoInput.current?.click()}
              className="grid justify-items-center gap-1 rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--card)] p-5 text-center">
              <b>Додати логотип</b>
              <span className="text-[13px] text-[var(--muted)]">SVG, PDF, PNG або JPG до 10 МБ, без доплати</span>
            </button>
          )}
          {!logo && <button type="button" id="bs-logo-sample" onClick={trySample} className="justify-self-start text-sm underline">Приміряти приклад логотипа</button>}
          {!logo && (
            <div className="grid min-w-0 gap-2 rounded-xl bg-[var(--surface)] p-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="bs-logo-dev" checked={logoDevelopment} onChange={(e) => setLogoDevelopment(e.target.checked)} className="accent-[var(--ink)]" />
                <span><b>Немає логотипа? Розробимо індивідуально</b>, у ціні вивіски</span></label>
              {logoDevelopment && (
                <textarea id="bs-logo-brief" rows={3} maxLength={500} value={logoBrief} onChange={(e) => setLogoBrief(e.target.value)}
                  placeholder="Назва, сфера, стиль, кольори, що подобається"
                  className="min-w-0 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-3 text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none" />
              )}
              {logoDevelopment && <span className="text-[13px] text-[var(--muted)]">Дизайнер намалює 2–3 варіанти і надішле вам на вибір перед виготовленням.</span>}
            </div>
          )}
          {logoError && <p role="alert" className="m-0 text-sm text-[var(--danger)]">{logoError}</p>}
        </fieldset>

        <PlaqueLinesEditor state={fonts} legend="Напис" idPrefix="bs" maxChars={CFG.maxLineChars} capByLine={capByLine} onRemove={onLineRemoved}
          renderExtra={(i) => (
            <div className="grid gap-1">
              <span className="text-sm text-[var(--muted)]">Колір рядка</span>
              <SheetSwatches sheets={BUSINESS_SIGN_PALETTE} value={lines[i]?.materialId ?? "mirror-gold"} onChange={(id) => setLineSheet(i, id)} idPrefix={`bs-line-${i}-c`} label={`Колір рядка ${i + 1}`} size="sm" />
            </div>
          )} />

        {round && (
          <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Текст по колу</legend>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="bs-arc" checked={arcOn} onChange={(e) => setArcOn(e.target.checked)} className="accent-[var(--ink)]" />Напис уздовж краю, як на емблемі</label>
            {arcOn && (
              <div className="grid min-w-0 gap-2 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-3">
                <input id="bs-arc-top" aria-label="Текст зверху" placeholder="Текст зверху" value={arcTop} maxLength={CFG.maxArcChars} onChange={(e) => setArcTop(e.target.value)} className={`${input} w-full min-w-0`} />
                <input id="bs-arc-bottom" aria-label="Текст знизу" placeholder="Текст знизу" value={arcBottom} maxLength={CFG.maxArcChars} onChange={(e) => setArcBottom(e.target.value)} className={`${input} w-full min-w-0`} />
                <select id="bs-arc-font" aria-label="Шрифт тексту по колу" value={arcFontId} onChange={(e) => setArcFontId(e.target.value)} className={`${input} w-full min-w-0`}>{fontOptions}</select>
                <SheetSwatches sheets={BUSINESS_SIGN_PALETTE} value={arcSheet} onChange={setArcSheet} idPrefix="bs-arc-c" label="Колір тексту по колу" size="sm" />
              </div>
            )}
          </fieldset>
        )}

        {shape !== "arrow" && shape !== "pointer" && (
          <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Рамка</legend>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="bs-frame" checked={frameId !== null} onChange={(e) => setFrameId(e.target.checked ? (lineSheets[0] ?? "mirror-gold") : null)} className="accent-[var(--ink)]" />Рамка вздовж краю</label>
            {frameId !== null && <SheetSwatches sheets={BUSINESS_SIGN_PALETTE} value={frameId} onChange={setFrameId} idPrefix="bs-frame-c" label="Колір рамки" size="sm" />}
          </fieldset>
        )}

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Кріплення</legend>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="bs-adh" checked={adhesive} onChange={(e) => setAdhesive(e.target.checked)} className="accent-[var(--ink)]" />Самоклейка на звороті</label>
          <div className="flex flex-wrap gap-2">{HOLES.map(([n, name]) => <PlaqueChip key={n} id={`bs-holes-${n}`} on={holes === n} onClick={() => setHoles(n)}>{name}</PlaqueChip>)}</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="bs-tpl" checked={template} onChange={(e) => setTemplate(e.target.checked)} className="accent-[var(--ink)]" />Монтажний трафарет для рівного кріплення</label>
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Кількість</legend>
          <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Менше" onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">−</button>
            <input id="bs-qty" type="number" min={1} max={9999} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(9999, Math.round(Number(e.target.value)) || 1)))} aria-label="Кількість" className="h-10 w-16 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
            <button type="button" aria-label="Більше" onClick={() => setQty(Math.min(9999, qty + 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">+</button>
          </div>
          <span className="text-[13px] text-[var(--muted)]">Від 10 шт −5%, від 50 шт −10%, від 100 шт −15%.{hint ? ` Додайте ще ${hint.addQty} шт., щоб отримати −${Math.round(hint.nextDiscount * 100)}%.` : ""}</span>
        </fieldset>

        {(checks.length > 0 || missing.length > 0 || empty) && (
          <ul className="m-0 grid list-none gap-1 rounded-xl bg-[var(--surface)] p-3 text-sm">
            {empty && <li className="text-[var(--danger)]">Додайте напис або логотип.</li>}
            {missing.length > 0 && <li className="text-[var(--danger)]">У шрифті немає символів: {missing.join(" ")}. Оберіть інший шрифт.</li>}
            {checks.map((c, i) => <li key={i} className={c.level === "error" ? "text-[var(--danger)]" : "text-[var(--muted)]"}>{c.message.uk}</li>)}
          </ul>
        )}

        <div className="grid gap-2 rounded-2xl bg-[var(--surface)] p-4">
          <ul className="m-0 grid list-none gap-0.5 p-0 text-[13px] text-[var(--muted)]">
            {price.lines.map((l, i) => <li key={i} className="flex justify-between gap-3"><span>{l.label}</span>{l.amount > 0 && <span className="tabular-nums">+{formatUAH(l.amount)}</span>}</li>)}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[30px] font-extrabold leading-none tabular-nums">{formatUAH(price.total)}
              <small className="mt-1 block text-[13px] font-normal text-[var(--muted)]">{qty > 1 ? `${formatUAH(price.unitPrice)} × ${qty} шт. · ` : ""}{price.needsManager ? "менеджер підтвердить строк" : dispatch}</small>
            </div>
            <button type="button" onClick={buy} disabled={!canBuy} className="h-[52px] rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] disabled:opacity-40">{buyLabel}</button>
          </div>
          {message && <p role="alert" className="m-0 text-sm text-[var(--danger)]">{message}</p>}
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--bg)] px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] lg:hidden">
        <b className="text-xl tabular-nums">{formatUAH(price.total)}</b>
        <button type="button" onClick={buy} disabled={!canBuy} className="h-12 rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] disabled:opacity-40">{state === "added" ? "✓ Додано" : state === "uploading" ? "Завантажуємо…" : "В кошик"}</button>
      </div>
    </div>
  );
}

