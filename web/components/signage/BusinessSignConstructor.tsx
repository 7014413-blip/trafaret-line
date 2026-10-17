"use client";

// Business sign constructor (Денис 2026-10-10): shape, size, base sheet and thickness, text lines
// each with its own font, size and sheet, the customer's logo, a mirror frame, text along the
// edge of round signs, mounting holes with standoffs or self-adhesive backing, quantity.
// Preview and price at once; the customer sees sizes in cm and UAH, never m².
// Layout: lib/business-sign/layout.ts; price: lib/calculators/signage.ts (repeated on the server).

import Link from "@/components/i18n/LocaleLink";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useEffect, useMemo, useState } from "react";
import { DraftLinkButton } from "@/components/constructor/DraftLinkButton";
import { FontOptions } from "@/components/constructor/FontOptions";
import { BusinessSignPreview, type BusinessSignView } from "@/components/signage/BusinessSignPreview";
import { BuyPanel } from "@/components/signage/BuyPanel";
import { ConstructorHeader } from "@/components/signage/ConstructorHeader";
import { DesignChecks } from "@/components/signage/DesignChecks";
import { LogoFileField } from "@/components/signage/LogoFileField";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { PlaqueLinesEditor } from "@/components/signage/PlaqueLinesEditor";
import { QuantityField } from "@/components/signage/QuantityField";
import { SheetSwatches } from "@/components/signage/SheetSwatches";
import { FIELDSET_CLASS, INPUT_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { DEFAULT_BUSINESS_SIGN_CONFIG } from "@/lib/business-sign/config";
import { computeBusinessSignLayout } from "@/lib/business-sign/layout";
import { measureArcText } from "@/lib/business-sign/measure-arc";
import { BUSINESS_SIGN_PALETTE, findBusinessSignSheet } from "@/lib/business-sign/palette";
import { businessSignToSignDesign } from "@/lib/business-sign/to-sign-design";
import { DEFAULT_SIGN_PRICING, checkSign, priceSign } from "@/lib/calculators/signage";
import { ensureLogoUploaded } from "@/lib/client/ensure-logo-uploaded";
import { SIGN_LOGO_ACCEPT, readSignLogoFile } from "@/lib/client/read-sign-logo-file";
import { useBuyState } from "@/lib/client/use-buy-state";
import { useDispatchLabel } from "@/lib/client/use-dispatch-label";
import { useUrlDraft } from "@/lib/client/use-url-draft";
import { parseBusinessSignDraft } from "@/lib/draft/business-sign-draft";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { businessSignThumbnailSvg } from "@/lib/export/business-sign-thumbnail";
import { cmText, formatUAH } from "@/lib/format";
import { decimal, units } from "@/lib/i18n/dictionaries/units";
import { SIGNAGE } from "@/lib/i18n/dictionaries/signage";
import { SIGNAGE_SIGN } from "@/lib/i18n/dictionaries/signage-sign";
import { tr } from "@/lib/i18n/translate";
import { loadFont } from "@/lib/text/font-loader";
import { useCart } from "@/store/cart-store";
import type { BusinessSignDesign, BusinessSignLine, BusinessSignLogo, BusinessSignLogoPlace } from "@/types/business-sign";
import type { BusinessSignDraft } from "@/types/draft";
import type { Locale } from "@/types/customizer";
import type { SignShape } from "@/types/signage";
import type { LoadedFont } from "@/types/text";

const CFG = DEFAULT_BUSINESS_SIGN_CONFIG;
const SHAPES: SignShape[] = ["circle", "rect", "rounded", "square", "arrow", "pointer"];
const PLACES: BusinessSignLogoPlace[] = ["above", "left"];
const HOLES: (0 | 2 | 4)[] = [0, 2, 4];
const isSquare = (shape: SignShape) => shape === "circle" || shape === "square";
const sizeName = (shape: SignShape, w: number, h: number, locale: Locale) => (shape === "circle" ? `Ø${cmText(w, locale)} ${units(locale).cm}` : `${cmText(w, locale)}×${cmText(isSquare(shape) ? w : h, locale)} ${units(locale).cm}`);

type LogoState = Omit<BusinessSignLogo, "fileName" | "format" | "aspect"> & { file: File; previewUrl: string; fileName: string; format: "svg" | "raster" | "pdf"; aspect: number; uploadKey: string | null };

export function BusinessSignConstructor() {
  const locale = useLocale();
  const t = tr(SIGNAGE_SIGN, locale);
  const s = tr(SIGNAGE, locale);
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
  const buyState = useBuyState();
  const dispatch = useDispatchLabel(locale);
  const fonts = usePlaqueLines([
    { text: t.exampleLines[0], fontId: "marck", size: 1.6 },
    { text: t.exampleLines[1], fontId: "montserrat", size: 0.6 },
  ], CFG.maxLines);
  const cart = useCart();

  // Revoke the preview URL of a replaced or removed logo.
  const logoUrl = logo?.previewUrl ?? null;
  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl); }, [logoUrl]);

  // The edge text has its own font: shop fonts load from the manifest, the customer's are loaded already.
  const { allFonts, customFonts, fontFor, fontsListed } = fonts;
  // A font that is not on this device (the customer's own font in a link opened elsewhere).
  useEffect(() => {
    if (fontsListed && allFonts.length && !allFonts.some((f) => f.id === arcFontId)) setArcFontId("pt-serif");
  }, [fontsListed, allFonts, arcFontId]);
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

  // The layout in the address (?draft=…) without the logo file: a link opens the same sign elsewhere.
  const draftNow: BusinessSignDraft = {
    shape: design.shape, widthMm: design.widthMm, heightMm: design.heightMm, direction: design.direction,
    baseMaterialId: design.baseMaterialId, baseThicknessMm: design.baseThicknessMm, lines: design.lines,
    arc: design.arc, frameMaterialId: design.frameMaterialId, holes: design.holes, selfAdhesive: design.selfAdhesive,
    positioningStencil: design.positioningStencil, logoDevelopment: design.logoDevelopment, logoBrief: design.logoBrief, quantity: design.quantity,
  };
  const applyDraft = (d: BusinessSignDraft) => {
    setShape(d.shape);
    setSize(d.widthMm, d.heightMm);
    setDirection(d.direction);
    setBaseId(d.baseMaterialId);
    setThickness(d.baseThicknessMm);
    fonts.replaceLines(d.lines.map(({ text, fontId, size }) => ({ text, fontId, size })));
    setLineSheets(d.lines.map((l) => l.materialId));
    setArcOn(!!d.arc);
    if (d.arc) { setArcTop(d.arc.top); setArcBottom(d.arc.bottom); setArcFontId(d.arc.fontId); setArcSheet(d.arc.materialId); }
    setFrameId(d.frameMaterialId);
    setHoles(d.holes);
    setAdhesive(d.selfAdhesive);
    setTemplate(d.positioningStencil);
    setLogoDevelopment(d.logoDevelopment);
    setLogoBrief(d.logoBrief);
    setQty(d.quantity);
  };
  const draft = useUrlDraft(parseBusinessSignDraft, applyDraft, draftNow);

  const arcMeasures = useMemo(() => ({
    top: round && arcOn && arcFont ? measureArcText(arcFont, arcTop) : null,
    bottom: round && arcOn && arcFont ? measureArcText(arcFont, arcBottom) : null,
  }), [round, arcOn, arcFont, arcTop, arcBottom]);
  const layout = computeBusinessSignLayout(design, fonts.measured, arcMeasures, CFG);
  const linePaths = new Map<number, string>();
  fonts.measured.forEach((m, i) => { if (m) linePaths.set(i, m.pathData); });
  const sign = businessSignToSignDesign(design, layout);
  const price = priceSign(sign, BUSINESS_SIGN_PALETTE, undefined, undefined, false, locale);
  const checks = checkSign(sign, BUSINESS_SIGN_PALETTE);
  const missing = [...new Set([...fonts.measured.flatMap((m) => m?.missing ?? []), ...layout.arcs.flatMap((a) => a.missing)])];
  const empty = !layout.lines.length && !layout.logo && !layout.arcs.length && !design.logoDevelopment;
  const errors = checks.filter((c) => c.level === "error");
  const canBuy = !empty && errors.length === 0 && fonts.fontsReady;
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
      setLogoError(t.sampleFailed);
    }
  };

  const buy = async () => {
    if (!canBuy || buyState.state === "uploading") return;
    const upload = await ensureLogoUploaded(logo, setLogo, buyState);
    if (!upload.ok) return;
    const { uploadKey } = upload;
    const texts = [...design.lines.map((l) => l.text.trim()), design.arc?.top.trim() ?? "", design.arc?.bottom.trim() ?? ""].filter(Boolean).join(" / ");
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `sign|${JSON.stringify({ ...design, quantity: 0 })}|${uploadKey ?? ""}`,
      title: t.cartTitle(texts, design.logo ? "own" : design.logoDevelopment ? "development" : null, sizeName(shape, layout.widthMm, layout.heightMm, locale)),
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
    buyState.added();
  };

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label={t.previewRegion} className="self-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[#f3f1ec] lg:sticky lg:top-24">
        <BusinessSignPreview design={design} layout={layout} linePaths={linePaths} logoUrl={logo?.previewUrl ?? null} view={view}
          label={t.previewLabel(sizeName(shape, layout.widthMm, layout.heightMm, locale))} />
        <div className="flex gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 pt-2.5">
          <PlaqueChip id="bs-view-close" on={view === "close"} onClick={() => setView("close")}>{s.close}</PlaqueChip>
          <PlaqueChip id="bs-view-wall" on={view === "wall"} onClick={() => setView("wall")}>{s.onWall}</PlaqueChip>
        </div>
        <div className="flex flex-wrap justify-between gap-2 bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{sizeName(shape, layout.widthMm, layout.heightMm, locale)}{layout.lines[0] ? t.lettersFrom(cmText(Math.min(...layout.lines.map((l) => l.capMm)), locale)) : ""}</span>
          <span>{base.name[locale]}, {decimal(thickness, locale)} {units(locale).mm}</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <ConstructorHeader kicker={t.kicker} title={t.title}
          lead={t.lead}>
          <p className="mt-1.5 mb-0 text-sm"><Link href="/vyvisky/vkazivnyky" className="underline">{t.links.pointer}</Link> · <Link href="/vyvisky/ofisni-tablychky" className="underline">{t.links.office}</Link> · <Link href="/vyvisky/napysy-na-plantsi" className="underline">{t.links.joined}</Link> · <Link href="/vyvisky/tablychky-poverkh" className="underline">{t.links.floors}</Link> · <Link href="/vyvisky/tablychky-na-dveri" className="underline">{t.links.doors}</Link> · <Link href="/vyvisky/nomerky" className="underline">{t.links.numbers}</Link></p>
        </ConstructorHeader>

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{t.shapeSize}</legend>
          <div className="flex flex-wrap gap-2">{SHAPES.map((v) => <PlaqueChip key={v} id={`bs-shape-${v}`} on={shape === v} onClick={() => pickShape(v)}>{t.shapes[v]}</PlaqueChip>)}</div>
          <div className="flex flex-wrap gap-2">
            {CFG.presets[shape].map((p) => (
              <PlaqueChip key={`${p.widthMm}x${p.heightMm}`} id={`bs-size-${p.widthMm}x${p.heightMm}`}
                on={widthMm === p.widthMm && (isSquare(shape) || heightMm === p.heightMm)} onClick={() => setSize(p.widthMm, p.heightMm)}>
                {sizeName(shape, p.widthMm, p.heightMm, locale)}{shape === "circle" && DEFAULT_SIGN_PRICING.circlePresetPrices[p.widthMm] ? ` · ${formatUAH(DEFAULT_SIGN_PRICING.circlePresetPrices[p.widthMm], locale)}` : ""}
              </PlaqueChip>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2">
            <label className="grid gap-1 text-sm text-[var(--muted)]">{round ? s.diameterCm : s.widthCm}
              <input id="bs-w" type="number" inputMode="decimal" min={CFG.minSideMm / 10} max={CFG.maxSideMm / 10} value={widthInput}
                onChange={(e) => { setWidthInput(e.target.value); const v = Number(e.target.value.replace(",", ".")); if (v > 0) setWidthMm(Math.min(CFG.maxSideMm, Math.max(CFG.minSideMm, Math.round(v * 10)))); }}
                onBlur={() => setWidthInput(String(widthMm / 10))} className={`${INPUT_CLASS} w-full min-w-0`} />
            </label>
            {!isSquare(shape) && (
              <label className="grid gap-1 text-sm text-[var(--muted)]">{s.heightCm}
                <input id="bs-h" type="number" inputMode="decimal" min={CFG.minSideMm / 10} max={CFG.maxSideMm / 10} value={heightInput}
                  onChange={(e) => { setHeightInput(e.target.value); const v = Number(e.target.value.replace(",", ".")); if (v > 0) setHeightMm(Math.min(CFG.maxSideMm, Math.max(CFG.minSideMm, Math.round(v * 10)))); }}
                  onBlur={() => setHeightInput(String(heightMm / 10))} className={`${INPUT_CLASS} w-full min-w-0`} />
              </label>
            )}
          </div>
          {(shape === "arrow" || shape === "pointer") && (
            <div className="flex flex-wrap gap-2">
              <PlaqueChip id="bs-dir-left" on={direction === -1} onClick={() => setDirection(-1)}>{t.left}</PlaqueChip>
              <PlaqueChip id="bs-dir-right" on={direction === 1} onClick={() => setDirection(1)}>{t.right}</PlaqueChip>
            </div>
          )}
        </fieldset>

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{s.base}</legend>
          <SheetSwatches sheets={BUSINESS_SIGN_PALETTE} value={baseId} onChange={pickBase} idPrefix="bs-base" label={t.baseColour} />
          <div className="flex flex-wrap gap-2">
            {thicknesses.map((mm) => <PlaqueChip key={mm} id={`bs-thick-${mm}`} on={thickness === mm} onClick={() => setThickness(mm)}>{decimal(mm, locale)} {units(locale).mm}{mm > 3 ? t.surcharge : ""}</PlaqueChip>)}
          </div>
          <span className="text-[13px] text-[var(--muted)]">{base.name[locale]}{base.inStock ? "" : s.toOrder}.</span>
        </fieldset>

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{s.logo}</legend>
          <LogoFileField inputId="bs-logo" accept={SIGN_LOGO_ACCEPT} fileName={logo?.fileName ?? null} onPick={pickLogo} onRemove={() => setLogo(null)}
            emptyHint={t.logoHint} error={logoError}
            after={(
              <>
                <button type="button" id="bs-logo-sample" onClick={trySample} className="justify-self-start text-sm underline">{t.trySample}</button>
                <div className="grid min-w-0 gap-2 rounded-xl bg-[var(--surface)] p-3">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="bs-logo-dev" checked={logoDevelopment} onChange={(e) => setLogoDevelopment(e.target.checked)} className="accent-[var(--ink)]" />
                    <span><b>{t.logoDevStrong}</b>{t.logoDevRest}</span></label>
                  {logoDevelopment && (
                    <textarea id="bs-logo-brief" rows={3} maxLength={500} value={logoBrief} onChange={(e) => setLogoBrief(e.target.value)}
                      placeholder={t.logoBriefPlaceholder}
                      className="min-w-0 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-3 text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none" />
                  )}
                  {logoDevelopment && <span className="text-[13px] text-[var(--muted)]">{t.logoDevNote}</span>}
                </div>
              </>
            )}>
            {logo && (
              <>
                {layout.lines.length > 0 && (
                  <>
                    <div className="flex flex-wrap gap-2">{PLACES.map((v) => <PlaqueChip key={v} id={`bs-logo-${v}`} on={logo.place === v} onClick={() => setLogo({ ...logo, place: v })}>{t.places[v]}</PlaqueChip>)}</div>
                    <label className="grid gap-1 text-sm text-[var(--muted)]">{t.logoSize}
                      <input id="bs-logo-size" type="range" min={0.25} max={0.75} step={0.05} value={logo.share} onChange={(e) => setLogo({ ...logo, share: Number(e.target.value) })} className="accent-[var(--ink)]" />
                    </label>
                  </>
                )}
                <span className="text-sm text-[var(--muted)]">{t.logoColour}</span>
                <SheetSwatches sheets={BUSINESS_SIGN_PALETTE} value={logo.materialId} onChange={(id) => setLogo({ ...logo, materialId: id })} idPrefix="bs-logo-c" label={t.logoColour} size="sm" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="bs-logo-invert" checked={logo.invert} onChange={(e) => setLogo({ ...logo, invert: e.target.checked })} className="accent-[var(--ink)]" />{s.logoInvert}</label>
                <span className="text-[13px] text-[var(--muted)]">{logo.format !== "svg"
                  ? t.logoRasterNote
                  : t.logoSvgNote}</span>
              </>
            )}
          </LogoFileField>
        </fieldset>

        <PlaqueLinesEditor state={fonts} legend={s.text} idPrefix="bs" maxChars={CFG.maxLineChars} capByLine={capByLine} onRemove={onLineRemoved}
          renderExtra={(i) => (
            <div className="grid gap-1">
              <span className="text-sm text-[var(--muted)]">{t.lineColour}</span>
              <SheetSwatches sheets={BUSINESS_SIGN_PALETTE} value={lines[i]?.materialId ?? "mirror-gold"} onChange={(id) => setLineSheet(i, id)} idPrefix={`bs-line-${i}-c`} label={t.lineColourOf(i + 1)} size="sm" />
            </div>
          )} />

        {round && (
          <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{t.arcLegend}</legend>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="bs-arc" checked={arcOn} onChange={(e) => setArcOn(e.target.checked)} className="accent-[var(--ink)]" />{t.arcToggle}</label>
            {arcOn && (
              <div className="grid min-w-0 gap-2 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-3">
                <input id="bs-arc-top" aria-label={t.arcTop} placeholder={t.arcTop} value={arcTop} maxLength={CFG.maxArcChars} onChange={(e) => setArcTop(e.target.value)} className={`${INPUT_CLASS} w-full min-w-0`} />
                <input id="bs-arc-bottom" aria-label={t.arcBottom} placeholder={t.arcBottom} value={arcBottom} maxLength={CFG.maxArcChars} onChange={(e) => setArcBottom(e.target.value)} className={`${INPUT_CLASS} w-full min-w-0`} />
                <select id="bs-arc-font" aria-label={t.arcFont} value={arcFontId} onChange={(e) => setArcFontId(e.target.value)} className={`${INPUT_CLASS} w-full min-w-0`}><FontOptions fonts={allFonts} current={arcFontId} /></select>
                <SheetSwatches sheets={BUSINESS_SIGN_PALETTE} value={arcSheet} onChange={setArcSheet} idPrefix="bs-arc-c" label={t.arcColour} size="sm" />
              </div>
            )}
          </fieldset>
        )}

        {shape !== "arrow" && shape !== "pointer" && (
          <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{t.frame}</legend>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="bs-frame" checked={frameId !== null} onChange={(e) => setFrameId(e.target.checked ? (lineSheets[0] ?? "mirror-gold") : null)} className="accent-[var(--ink)]" />{t.frameToggle}</label>
            {frameId !== null && <SheetSwatches sheets={BUSINESS_SIGN_PALETTE} value={frameId} onChange={setFrameId} idPrefix="bs-frame-c" label={t.frameColour} size="sm" />}
          </fieldset>
        )}

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{t.mounting}</legend>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="bs-adh" checked={adhesive} onChange={(e) => setAdhesive(e.target.checked)} className="accent-[var(--ink)]" />{t.adhesive}</label>
          <div className="flex flex-wrap gap-2">{HOLES.map((n) => <PlaqueChip key={n} id={`bs-holes-${n}`} on={holes === n} onClick={() => setHoles(n)}>{t.holes[n]}</PlaqueChip>)}</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="bs-tpl" checked={template} onChange={(e) => setTemplate(e.target.checked)} className="accent-[var(--ink)]" />{t.template}</label>
        </fieldset>

        <QuantityField idPrefix="bs" value={qty} onChange={setQty} />

        <DesignChecks checks={checks} errors={[
          ...(empty ? [s.emptyDesign] : []),
          ...(missing.length > 0 ? [s.missingChars(missing.join(" "))] : []),
        ]} />

        <BuyPanel lines={price.lines} total={price.total} unitPrice={price.unitPrice} qty={qty} note={price.needsManager ? s.managerConfirms : dispatch}
          state={buyState.state} message={buyState.message} canBuy={canBuy} onBuy={buy} />
        <DraftLinkButton link={draft.link}
          note={logo ? t.draftNoteLogo : t.draftNote} />
      </form>
    </div>
  );
}

