"use client";

// «Свій напис» constructor (research/algoritm-konstruktora.md). Two products:
//   Трафарет      — a sheet with the text cut out; bridges are placed by the Clipper2
//                   cutter (lib/geometry/bridges.ts) at the thinnest point of each stroke.
//   Цілим словом — the text itself as one solid piece (cake topper, acrylic word);
//                   letters are welded together (lib/geometry/weld.ts).
// Prices come from lib/calculators/pricing.ts (the server repeats them); m² is never shown.

import Link from "@/components/i18n/LocaleLink";
import { LEGEND_CLASS } from "@/components/ui/form-classes";
import { FontOptions } from "@/components/constructor/FontOptions";
import { useEffect, useMemo, useState } from "react";
import { cutRequestFor, useCustomizer } from "@/store/customizer-store";
import { useCart } from "@/store/cart-store";
import { MATERIALS, WELD_MATERIALS } from "@/lib/materials";
import { DEFAULT_PRICING, priceStencil, priceWelded } from "@/lib/calculators/pricing";
import { designPlacement } from "@/lib/calculators/design-fit";
import { SQUARE_STENCIL_MATERIAL, SQUARE_STENCIL_PRESETS } from "@/lib/calculators/square-stencil";
import { formatUAH } from "@/lib/format";
import { loadFont, loadFontManifest, registerLoadedFont, type FontEntry, type LoadedFont } from "@/lib/text/font-loader";
import { listCustomFonts } from "@/lib/client/custom-fonts";
import { fontEntry } from "@/lib/text/font-entry";
import { textToDesign, type Align, type TextDesignResult } from "@/lib/text/text-layout";
import { DEFAULT_WELD } from "@/lib/geometry/weld";
import { computeStencilCut, computeWeld } from "@/lib/client/geometry-client";
import { stencilThumbnailSvg, weldThumbnailSvg } from "@/lib/export/cart-thumbnail";
import { readKonstruktorMode, writeKonstruktorMode, type KonstruktorMode } from "@/lib/client/konstruktor-mode";
import { useUrlDraft } from "@/lib/client/use-url-draft";
import { parseKonstruktorDraft } from "@/lib/draft/konstruktor-draft";
import type { KonstruktorDraft } from "@/types/draft";
import type { MaterialType } from "@/types/customizer";
import type { BridgeStrength, WeldOptions } from "@/types/geometry";
import type { SizedWeld } from "@/types/geometry-worker";
import { CustomFontPanel } from "./CustomFontPanel";
import { DraftLinkButton } from "./DraftLinkButton";
import { FontChip } from "./FontChip";
import { StencilPreview, type StencilView } from "./StencilPreview";
import { WeldPreview, type WeldView } from "./WeldPreview";
import { WeldOptionsPanel } from "./WeldOptionsPanel";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CONSTRUCTOR } from "@/lib/i18n/dictionaries/constructor";
import { tr } from "@/lib/i18n/translate";
import { decimal, units } from "@/lib/i18n/dictionaries/units";

type Mode = KonstruktorMode;

const WIDTHS = [21, 30, 50, 80, 100, 140];
const WELD_WIDTHS = [10, 12, 15, 20, 25, 30];
const STENCIL_MATS: MaterialType[] = ["pet_thin", "polystyrene", "acrylic"];
const STENCIL_VIEWS: StencilView[] = ["stencil", "wall", "cake"];
const WELD_VIEWS: WeldView[] = ["piece", "cake"];
const BRIDGE_STRENGTHS: BridgeStrength[] = ["thin", "normal", "strong"];
const MODES: Mode[] = ["stencil", "weld"];

const chip = (on: boolean) => `rounded-full border-[1.5px] px-3 py-1.5 ${on ? "border-[var(--ink)] font-bold" : "border-[var(--line)]"}`;

export function Konstruktor() {
  const locale = useLocale();
  const t = tr(CONSTRUCTOR, locale);
  const s = useCustomizer();
  const cart = useCart();
  const [fonts, setFonts] = useState<FontEntry[]>([]);
  const [font, setFont] = useState<LoadedFont | null>(null);
  const [fontError, setFontError] = useState(false);
  const [align, setAlign] = useState<Align>("center");
  const [upper, setUpper] = useState(false);
  const [mode, setModeState] = useState<Mode>("stencil");
  // The mode survives a reload (QA m4): kept in the address (?mode=weld).
  useEffect(() => setModeState(readKonstruktorMode()), []);
  const setMode = (next: Mode) => { setModeState(next); writeKonstruktorMode(next); };
  const [view, setView] = useState<StencilView>("stencil");
  const [weldView, setWeldView] = useState<WeldView>("piece");
  const [byLetter, setByLetter] = useState(false);
  const [letterMm, setLetterMm] = useState(100);
  const [result, setResult] = useState<TextDesignResult | null>(null);
  const [weldOptions, setWeldOptions] = useState<WeldOptions>(DEFAULT_WELD);
  const [weldWidthMm, setWeldWidthMm] = useState(150);
  const weldMaterials = WELD_MATERIALS.filter((id) => MATERIALS[id].colours.length > 0 && MATERIALS[id].baseSquareMeterPrice != null);
  const [weldMaterial, setWeldMaterial] = useState<MaterialType>(weldMaterials[0]);
  const [colourId, setColourId] = useState<string>(MATERIALS[weldMaterials[0]].colours[0].id);
  const text = s.text || t.defaultText;

  // The customer's own fonts (IndexedDB), shown after the shop fonts.
  const [customFonts, setCustomFonts] = useState<LoadedFont[]>([]);
  useEffect(() => {
    listCustomFonts(locale).then((list) => { list.forEach(registerLoadedFont); setCustomFonts(list); }).catch(() => setCustomFonts([]));
  }, [locale]);
  const allFonts = useMemo<FontEntry[]>(() => [...fonts, ...customFonts.map(fontEntry)], [fonts, customFonts]);

  // A different font per line (Денис 10.10): empty entry = the main font.
  const [perLine, setPerLine] = useState(false);
  const [lineFontIds, setLineFontIds] = useState<string[]>([]);
  const [lineFonts, setLineFonts] = useState<(LoadedFont | null)[]>([]);
  const textLines = text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 4);

  useEffect(() => {
    loadFontManifest().then(setFonts).catch(() => setFontError(true));
  }, []);

  useEffect(() => {
    if (!allFonts.length) return;
    const entry = allFonts.find((f) => f.id === s.fontFamily) ?? allFonts[0];
    loadFont(entry).then(setFont).catch(() => setFontError(true));
  }, [allFonts, s.fontFamily]);

  useEffect(() => {
    if (!perLine) { setLineFonts([]); return; }
    let live = true;
    Promise.all(lineFontIds.map((id) => {
      const entry = id ? allFonts.find((f) => f.id === id) : undefined;
      return entry ? loadFont(entry).catch(() => null) : Promise.resolve(null);
    })).then((list) => { if (live) setLineFonts(list); });
    return () => { live = false; };
  }, [perLine, lineFontIds, allFonts]);

  // Rebuild the design when text, fonts or style change; the store builds the cut.
  useEffect(() => {
    if (!font) return;
    const r = textToDesign(font, text, { align, upper, lineFonts: perLine ? lineFonts : undefined });
    setResult(r);
    const { scale } = designPlacement(r.design, s.widthMm, s.marginMm, s.shape === "square");
    s.setDesign(r.design, r.capUnits * scale);
  }, [font, text, align, upper, perLine, lineFonts]); // eslint-disable-line react-hooks/exhaustive-deps

  const usedLineFontIds = perLine ? textLines.map((_, i) => lineFontIds[i] ?? "") : [];
  const setLineFont = (index: number, id: string) => setLineFontIds((list) => {
    const next = [...list];
    while (next.length <= index) next.push("");
    next[index] = id;
    return next;
  });

  // The layout in the address (?draft=…): a link opens the same layout on another device.
  const draftNow: KonstruktorDraft = {
    mode, text, fontId: s.fontFamily, widthMm: s.widthMm, marginMm: s.marginMm, shape: s.shape === "square" ? "square" : "rect",
    materialId: s.materialId, bridgeStrength: s.bridgeStrength, align, upper,
    lineFontIds: perLine ? usedLineFontIds : [], byLetter, letterMm,
    weld: {
      widthMm: weldWidthMm, materialId: weldMaterial, colourId, overlapShare: weldOptions.overlapShare,
      baseline: weldOptions.baseline.enabled, outline: weldOptions.outline.enabled,
      skewers: weldOptions.skewers.count, skewerLengthMm: weldOptions.skewers.lengthMm,
    },
  };
  const applyDraft = (d: KonstruktorDraft) => {
    setMode(d.mode);
    s.set({ text: d.text, fontFamily: d.fontId, widthMm: d.widthMm, marginMm: d.marginMm, shape: d.shape, materialId: d.materialId, bridgeStrength: d.bridgeStrength });
    setAlign(d.align);
    setUpper(d.upper);
    setPerLine(d.lineFontIds.length > 0);
    setLineFontIds(d.lineFontIds);
    setByLetter(d.byLetter);
    setLetterMm(d.letterMm);
    setWeldWidthMm(d.weld.widthMm);
    setWeldMaterial(d.weld.materialId);
    setColourId(d.weld.colourId);
    setWeldOptions({
      ...DEFAULT_WELD,
      overlapShare: d.weld.overlapShare,
      baseline: { ...DEFAULT_WELD.baseline, enabled: d.weld.baseline },
      outline: { ...DEFAULT_WELD.outline, enabled: d.weld.outline },
      skewers: { ...DEFAULT_WELD.skewers, count: d.weld.skewers, lengthMm: d.weld.skewerLengthMm },
    });
  };
  const draft = useUrlDraft((raw) => parseKonstruktorDraft(raw, { stencil: STENCIL_MATS, weld: weldMaterials }), applyDraft, draftNow);

  // Width changed: the cap height changes with it (bridge width follows the letters).
  useEffect(() => {
    if (!result) return;
    const { scale } = designPlacement(result.design, s.widthMm, s.marginMm, s.shape === "square");
    const cap = result.capUnits * scale;
    if (Math.abs((s.capHeightMm ?? 0) - cap) > 0.01) s.setDesign(result.design, cap);
  }, [s.widthMm, s.marginMm, s.shape, result]); // eslint-disable-line react-hooks/exhaustive-deps

  // "By letter height": choose the sheet width that gives the requested cap height.
  useEffect(() => {
    if (!byLetter || !result || s.shape === "square") return;
    const width = Math.round((letterMm / result.capUnits) * result.design.bboxMm.w + 2 * s.marginMm);
    if (width !== s.widthMm) s.set({ widthMm: Math.max(100, Math.min(4000, width)) });
  }, [byLetter, letterMm, result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cut with bridges: built in the geometry worker, the store keeps it while the geometry is the same.
  const cutRequest = useMemo(
    () => cutRequestFor(s),
    [s.design, s.widthMm, s.marginMm, s.capHeightMm, s.shape, s.bridgeStrength, s.materialId], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [cutFailed, setCutFailed] = useState(false);
  useEffect(() => {
    if (!cutRequest || mode !== "stencil" || s.cutKey === cutRequest.key) return;
    let live = true;
    setCutFailed(false);
    computeStencilCut(cutRequest.groups, cutRequest.options)
      .then((cut) => { if (live) s.setCut(cutRequest.key, cut); })
      .catch(() => { if (live) setCutFailed(true); });
    return () => { live = false; };
  }, [cutRequest, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Welded word: also built in the worker.
  const [weld, setWeld] = useState<SizedWeld | null>(null);
  const [weldBusy, setWeldBusy] = useState(false);
  useEffect(() => {
    if (mode !== "weld" || !result) return;
    let live = true;
    setWeldBusy(true);
    computeWeld(result.glyphs, result.capUnits, weldWidthMm, align, weldOptions)
      .then((w) => { if (live) setWeld(w); })
      .catch(() => { if (live) setWeld(null); })
      .finally(() => { if (live) setWeldBusy(false); });
    return () => { live = false; };
  }, [mode, result, weldWidthMm, align, weldOptions]);

  const material = MATERIALS[s.materialId];
  const sheet = s.sheet;
  const capMm = s.capHeightMm ?? 0;
  const tiers = [{ minQty: 1, discount: 0 }, ...DEFAULT_PRICING.stencilTiers];

  const weldMat = MATERIALS[weldMaterial];
  const weldColour = weldMat.colours.find((c) => c.id === colourId) ?? weldMat.colours[0];
  const weldW = weld ? weld.result.bbox.maxX : 0;
  const weldH = weld ? weld.result.bbox.maxY : 0;

  const tierPrice = (q: number) => (mode === "weld" ? priceWelded(weldW, weldH, weldMat, q).unitPrice : priceStencil(sheet, material, q).unitPrice);
  const unit = tierPrice(s.quantity);
  const total = unit * s.quantity;

  const stencilErrors = s.checks.filter((c) => c.level === "error");
  const weldProblems = weld && weld.result.pieces > 1 ? [t.weldApart] : [];
  const missing = result?.missing.length ? [t.missingChars(result.missing.join(" "))] : [];
  const notes = mode === "weld"
    ? [...missing, ...weldProblems]
    : [...missing, ...s.checks.filter((c) => c.code !== "empty").map((c) => c.message[locale])];
  const canBuy = mode === "weld"
    ? !!weld && !weldBusy && weld.result.pieces === 1 && !missing.length
    : stencilErrors.length === 0 && !missing.length && !!s.cut;

  // Why «Купити» is not active yet (QA m3): the geometry is still being computed.
  const buyHint = canBuy ? ""
    : mode === "weld" ? (weldBusy || !weld ? t.weldBusy : "")
    : !s.cut && !cutFailed && !stencilErrors.length ? t.bridgesBusy : "";

  const buy = () => {
    if (!canBuy || !font) return;
    const oneLine = text.replace(/\n/g, " ");
    if (mode === "weld" && weld) {
      cart.add({
        key: `w|${text}|${font.id}|${usedLineFontIds.join(",")}|${Math.round(weldW)}|${weldMaterial}|${weldColour.id}|${JSON.stringify(weldOptions)}`,
        kind: "welded",
        title: t.cartWeld(oneLine, font.name, weldMat.name[locale], weldColour.name[locale]),
        materialId: weldMaterial,
        widthCm: Math.round(weldW) / 10,
        heightCm: Math.round(weldH) / 10,
        quantity: s.quantity,
        section: "sweet",
        vectorSvg: weldThumbnailSvg(weldW, weldH, weld.result.shapes, weldColour.hex),
        spec: { text, fontId: font.id, lineFontIds: usedLineFontIds, align, upper, widthMm: Math.round(weldW), heightMm: Math.round(weldH), colourId: weldColour.id, weld: weldOptions },
      });
      return;
    }
    cart.add({
      key: `k|${text}|${font.id}|${usedLineFontIds.join(",")}|${s.shape === "square" ? "sq" : ""}${sheet.widthMm}|${s.materialId}|${align}|${upper}`,
      kind: "stencil",
      title: t.cartStencil(oneLine, font.name),
      materialId: s.materialId,
      widthCm: sheet.widthMm / 10,
      heightCm: sheet.heightMm / 10,
      quantity: s.quantity,
      section: "sweet",
      vectorSvg: s.cut ? stencilThumbnailSvg(sheet.widthMm, sheet.heightMm, s.cut.cutPaths, material.look.face) : undefined,
      spec: { text, fontId: font.id, lineFontIds: usedLineFontIds, align, upper, widthMm: sheet.widthMm, heightMm: sheet.heightMm, marginMm: s.marginMm, square: s.shape === "square", bridges: s.cut?.bridges.length ?? 0, bridgeStrength: s.bridgeStrength },
    });
  };

  const preview = mode === "weld"
    ? (weld ? <WeldPreview weld={weld.result} material={weldMat} colourHex={weldColour.hex} view={weldView} label={t.piecePreview(Math.round(weldW / 10), Math.round(weldH / 10))} /> : null)
    : (s.cut ? <StencilPreview sheet={sheet} cut={s.cut} material={material} view={view} showIssues={view === "stencil"} label={t.stencilPreview(Math.round(sheet.widthMm / 10), Math.round(sheet.heightMm / 10))} /> : null);

  const footer = mode === "weld"
    ? t.footerWeld((weldW / 10).toFixed(1), (weldH / 10).toFixed(1), Math.round(weld?.capMm ?? 0))
    : t.footerStencil((sheet.widthMm / 10).toFixed(0), (sheet.heightMm / 10).toFixed(1), Math.round(capMm), s.cut?.bridges.length ?? 0);

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label={t.preview} className="self-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] lg:sticky lg:top-24">
        <div role="tablist" className="flex gap-1 border-b border-[var(--line)] p-2">
          {(mode === "weld" ? WELD_VIEWS : STENCIL_VIEWS).map((v) => {
            const selected = mode === "weld" ? v === weldView : v === view;
            return (
              <button key={v} role="tab" aria-selected={selected} type="button"
                onClick={() => (mode === "weld" ? setWeldView(v as WeldView) : setView(v as StencilView))}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold ${selected ? "bg-[var(--surface)] text-[var(--ink)]" : "text-[var(--muted)]"}`}>{t.views[v]}</button>
            );
          })}
        </div>
        {preview ?? (
          <div className="grid aspect-[2/1] place-items-center text-[var(--muted)]">
            {fontError ? t.fontLoadFailed
              : cutFailed ? t.bridgesFailed
              : result ? t.bridgesCalculating : t.fontsLoadingLong}
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--line)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{footer}</span>
          <span>{mode === "weld" ? `${weldMat.name[locale]}, ${weldColour.name[locale]}` : material.name[locale]}</span>
        </div>
      </section>

      <form className="grid content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <header>
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{t.kicker}</p>
          <h1 className="m-0 mt-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,34px)] font-bold leading-tight">{t.title}</h1>
          <p className="m-0 mt-1 text-sm text-[var(--muted)]">{t.canvasLink} <Link href="/konstruktor/polotno" className="font-semibold text-[var(--ink)] underline">{t.canvasLinkText}</Link></p>
        </header>

        <fieldset role="radiogroup" aria-labelledby="k-mode-legend" className="grid gap-2 sm:grid-cols-2">
          <legend id="k-mode-legend" className={LEGEND_CLASS}>{t.whatWeMake}</legend>
          {MODES.map((m) => (
            <label key={m} className={`grid cursor-pointer gap-0.5 rounded-xl border-[1.5px] px-3.5 py-3 ${mode === m ? "border-[var(--ink)]" : "border-[var(--line)]"} bg-[var(--card)]`}>
              <span className="flex items-center gap-2">
                <input type="radio" name="k-mode" id={`k-mode-${m}`} value={m} checked={mode === m} onChange={() => setMode(m)}
                  aria-describedby={`k-mode-${m}-hint`} className="h-[18px] w-[18px] accent-[var(--ink)]" />
                <b>{t.modes[m].title}</b>
              </span>
              <span id={`k-mode-${m}-hint`} className="text-[13px] text-[var(--muted)]">{t.modes[m].hint}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className={LEGEND_CLASS}>{t.text}</legend>
          <textarea id="k-text" rows={3} value={s.text} placeholder={t.defaultText} maxLength={120}
            onChange={(e) => s.set({ text: e.target.value.split("\n").slice(0, 4).join("\n") })}
            className="w-full resize-y rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3.5 py-3 text-lg focus:border-[var(--ink)] focus:outline-none" />
          <div className="flex flex-wrap gap-2">
            {t.templates.map((template) => (
              <button key={template} type="button" onClick={() => s.set({ text: template })} className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-sm">{template.replace("\n", " ")}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {(["left", "center", "right"] as Align[]).map((a) => (
              <button key={a} type="button" aria-pressed={align === a} onClick={() => setAlign(a)} className={chip(align === a)}>
                {a === "left" ? t.alignLeft : a === "center" ? t.alignCenter : t.alignRight}
              </button>
            ))}
            <button type="button" aria-pressed={upper} onClick={() => setUpper(!upper)} className={chip(upper)}>{t.upper}</button>
          </div>
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className={LEGEND_CLASS}>{t.font}</legend>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {allFonts.map((f) => <FontChip key={f.id} entry={f} text={text} active={(font?.id ?? allFonts[0]?.id) === f.id} onPick={() => s.set({ fontFamily: f.id })} />)}
          </div>
          {textLines.length > 1 && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" id="k-per-line" checked={perLine} onChange={(e) => setPerLine(e.target.checked)} className="h-4 w-4 accent-[var(--ink)]" />
              {t.perLineFonts}
            </label>
          )}
          {perLine && textLines.length > 1 && (
            <div className="grid gap-2">
              {textLines.map((line, i) => (
                <label key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-2 text-sm">
                  <span className="truncate">{t.lineLabel(i + 1, line)}</span>
                  <select id={`k-line-font-${i}`} value={lineFontIds[i] ?? ""} onChange={(e) => setLineFont(i, e.target.value)}
                    className="h-10 rounded-lg border border-[var(--line)] bg-[var(--card)] px-2">
                    <option value="">{t.sameAsMain(font?.name ?? "—")}</option>
                    <FontOptions fonts={allFonts} />
                  </select>
                </label>
              ))}
            </div>
          )}
          <CustomFontPanel fonts={customFonts} text={text}
            onAdded={(added) => { registerLoadedFont(added); setCustomFonts((list) => [...list.filter((f) => f.id !== added.id), added]); s.set({ fontFamily: added.id }); }}
            onRemoved={(removed) => {
              setCustomFonts((list) => list.filter((f) => f.id !== removed));
              setLineFontIds((list) => list.map((x) => (x === removed ? "" : x)));
              if (s.fontFamily === removed) s.set({ fontFamily: fonts[0]?.id ?? "" });
            }} />
        </fieldset>

        {mode === "stencil" ? (
          <>
            <fieldset className="grid gap-2">
              <legend className={LEGEND_CLASS}>{t.size}</legend>
              <div className="flex flex-wrap gap-2 text-sm">
                <button id="k-size-width" type="button" aria-pressed={s.shape !== "square" && !byLetter} onClick={() => { setByLetter(false); s.set({ shape: "rect" }); }} className={chip(s.shape !== "square" && !byLetter)}>{t.byWidth}</button>
                <button id="k-size-letter" type="button" aria-pressed={s.shape !== "square" && byLetter} onClick={() => { setByLetter(true); s.set({ shape: "rect" }); }} className={chip(s.shape !== "square" && byLetter)}>{t.byLetter}</button>
                <button id="k-size-square" type="button" aria-pressed={s.shape === "square"} onClick={() => { setByLetter(false); s.set({ shape: "square", widthMm: SQUARE_STENCIL_PRESETS.some((p) => p.sideMm === s.widthMm) ? s.widthMm : 300 }); }} className={chip(s.shape === "square")}>{t.square}</button>
              </div>
              {s.shape === "square" ? (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {SQUARE_STENCIL_PRESETS.map((p) => (
                      <button key={p.sideMm} id={`k-square-${p.sideMm / 10}`} type="button" aria-pressed={s.widthMm === p.sideMm} onClick={() => s.set({ widthMm: p.sideMm })}
                        className={`grid min-h-14 gap-0.5 rounded-xl border-[1.5px] px-2 py-1.5 tabular-nums ${s.widthMm === p.sideMm ? "border-[2px] border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
                        <b className="text-[15px]">{decimal(p.sideMm / 10, locale)}×{decimal(p.sideMm / 10, locale)} {units(locale).cm}</b>
                        <span className="text-[13px] text-[var(--muted)]">{formatUAH(priceStencil({ shape: "square", widthMm: p.sideMm, heightMm: p.sideMm }, material, 1).unitPrice, locale)}</span>
                      </button>
                    ))}
                  </div>
                  <span className="text-[13px] text-[var(--muted)]">
                    {t.squareNote}{s.materialId !== SQUARE_STENCIL_MATERIAL ? t.squareOtherMaterial : ""}{t.ownLogo} <Link href="/na-zamovlennia" className="underline">{t.byYourLayout}</Link>.
                  </span>
                </>
              ) : !byLetter ? (
                <>
                  <label className="grid gap-1 text-sm text-[var(--muted)]">{t.widthCm}
                    <input id="k-width" type="number" min={10} max={400} value={Math.round(s.widthMm / 10)} onChange={(e) => s.set({ widthMm: Math.max(100, Math.min(4000, Number(e.target.value) * 10)) })}
                      className="h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-base text-[var(--ink)]" />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WIDTHS.map((w) => (
                      <button key={w} type="button" aria-pressed={s.widthMm === w * 10} onClick={() => s.set({ widthMm: w * 10 })}
                        className={`h-10 rounded-full border-[1.5px] px-3.5 tabular-nums ${s.widthMm === w * 10 ? "border-[var(--ink)] bg-[var(--surface)] font-bold" : "border-[var(--line)] bg-[var(--card)]"}`}>
                        {w === 21 ? "A4 · 21" : w} {units(locale).cm}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <label className="grid gap-1 text-sm text-[var(--muted)]">{t.capHeightMm}
                  <input id="k-letter" type="number" min={10} max={1000} value={letterMm} onChange={(e) => setLetterMm(Math.max(10, Number(e.target.value)))}
                    className="h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-base text-[var(--ink)]" />
                </label>
              )}
            </fieldset>

            <fieldset className="grid gap-2">
              <legend className={LEGEND_CLASS}>{t.material}</legend>
              {STENCIL_MATS.map((id) => {
                const m = MATERIALS[id];
                return (
                  <label key={id} className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-3 ${s.materialId === id ? "border-[var(--ink)]" : "border-[var(--line)]"} bg-[var(--card)]`}>
                    <input type="radio" name="k-mat" id={`k-mat-${id}`} checked={s.materialId === id} onChange={() => s.set({ materialId: id })} className="h-[18px] w-[18px] accent-[var(--ink)]" />
                    <span><b className="block">{m.name[locale]}</b><span className="text-[13px] text-[var(--muted)]">{m.note[locale]}</span></span>
                    <em className="not-italic font-semibold tabular-nums">{formatUAH(priceStencil(sheet, m, 1).unitPrice, locale)}</em>
                  </label>
                );
              })}
            </fieldset>

            <fieldset role="radiogroup" aria-labelledby="k-bridges-legend" className="grid gap-2">
              <legend id="k-bridges-legend" className={LEGEND_CLASS}>{t.bridges}</legend>
              <div className="flex flex-wrap gap-2 text-sm">
                {BRIDGE_STRENGTHS.map((value) => (
                  <label key={value} className={`${chip(s.bridgeStrength === value)} flex cursor-pointer items-center gap-1.5`}>
                    <input type="radio" name="k-bridges" value={value} checked={s.bridgeStrength === value} onChange={() => s.set({ bridgeStrength: value })} className="sr-only" />
                    {t.bridgeStrengths[value]}
                  </label>
                ))}
              </div>
              <span className="text-[13px] text-[var(--muted)]">{t.bridgesNote}</span>
            </fieldset>
          </>
        ) : (
          <>
            <fieldset className="grid gap-2">
              <legend className={LEGEND_CLASS}>{t.pieceWidth}</legend>
              <label className="grid gap-1 text-sm text-[var(--muted)]">{t.widthCm}
                <input id="k-weld-width" type="number" min={5} max={100} value={Math.round(weldWidthMm / 10)}
                  onChange={(e) => setWeldWidthMm(Math.max(50, Math.min(1000, Number(e.target.value) * 10)))}
                  className="h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-base text-[var(--ink)]" />
              </label>
              <div className="flex flex-wrap gap-2">
                {WELD_WIDTHS.map((w) => (
                  <button key={w} type="button" aria-pressed={weldWidthMm === w * 10} onClick={() => setWeldWidthMm(w * 10)}
                    className={`h-10 rounded-full border-[1.5px] px-3.5 tabular-nums ${weldWidthMm === w * 10 ? "border-[var(--ink)] bg-[var(--surface)] font-bold" : "border-[var(--line)] bg-[var(--card)]"}`}>{decimal(w, locale)} {units(locale).cm}</button>
                ))}
              </div>
            </fieldset>

            <WeldOptionsPanel value={weldOptions} onChange={setWeldOptions} />

            <fieldset className="grid gap-2">
              <legend className={LEGEND_CLASS}>{t.materialColour}</legend>
              {weldMaterials.map((id) => {
                const m = MATERIALS[id];
                return (
                  <label key={id} className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-3 ${weldMaterial === id ? "border-[var(--ink)]" : "border-[var(--line)]"} bg-[var(--card)]`}>
                    <input type="radio" name="k-weld-mat" id={`k-weld-mat-${id}`} checked={weldMaterial === id}
                      onChange={() => { setWeldMaterial(id); setColourId(m.colours[0].id); }} className="h-[18px] w-[18px] accent-[var(--ink)]" />
                    <b>{m.name[locale]}</b>
                    <em className="not-italic font-semibold tabular-nums">{weld ? formatUAH(priceWelded(weldW, weldH, m, 1).unitPrice, locale) : ""}</em>
                  </label>
                );
              })}
              <div className="flex flex-wrap gap-2">
                {weldMat.colours.map((c) => (
                  <button key={c.id} type="button" aria-pressed={weldColour.id === c.id} onClick={() => setColourId(c.id)}
                    className={`flex items-center gap-2 rounded-full border-[1.5px] px-3 py-1.5 text-sm ${weldColour.id === c.id ? "border-[var(--ink)] font-bold" : "border-[var(--line)]"}`}>
                    <span className="h-4 w-4 rounded-full border border-[var(--line)]" style={{ background: c.hex }} aria-hidden />{c.name[locale]}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}

        <fieldset className="grid gap-2">
          <legend className={LEGEND_CLASS}>{t.quantityTiers}</legend>
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs tabular-nums">
            {tiers.map((tier) => {
              const on = s.quantity >= tier.minQty && !tiers.some((x) => x.minQty > tier.minQty && s.quantity >= x.minQty);
              return (
                <button type="button" key={tier.minQty} onClick={() => s.set({ quantity: tier.minQty })}
                  className={`rounded-lg border-[1.5px] px-1 py-1.5 ${on ? "border-[var(--ok)] text-[var(--ink)]" : "border-dashed border-[var(--line)] text-[var(--muted)]"}`}>
                  <b className="block text-sm text-[var(--ink)]">{formatUAH(tierPrice(tier.minQty), locale)}</b>{tier.minQty === 1 ? t.onePiece : t.fromQty(tier.minQty)}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" aria-label={t.less} onClick={() => s.set({ quantity: s.quantity - 1 })} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">−</button>
            <input id="k-qty" type="number" min={1} value={s.quantity} onChange={(e) => s.set({ quantity: Number(e.target.value) || 1 })} aria-label={t.quantity}
              className="h-10 w-16 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
            <button type="button" aria-label={t.more} onClick={() => s.set({ quantity: s.quantity + 1 })} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">+</button>
          </div>
        </fieldset>

        {notes.length > 0 && <p role="status" className="m-0 rounded-xl bg-[var(--surface)] p-3 text-sm text-[var(--danger)]">{notes.join(" ")}</p>}
        {mode === "stencil" && s.checks.filter((c) => c.fixWidthMm && c.fixWidthMm !== s.widthMm).slice(0, 1).map((c) => (
          <button key={c.code} type="button" onClick={() => { setByLetter(false); s.set({ widthMm: Math.min(4000, c.fixWidthMm as number) }); }}
            className="h-11 justify-self-start rounded-full px-5 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)]">
            {t.enlargeTo(Math.round((c.fixWidthMm as number) / 10))}
          </button>
        ))}

        <div className="hidden items-center justify-between gap-3 rounded-2xl bg-[var(--surface)] p-4 lg:flex">
          <div className="text-[30px] font-extrabold leading-none tabular-nums">{formatUAH(total, locale)}
            <small className="mt-1 block text-[13px] font-normal text-[var(--muted)]">{s.quantity > 1 ? `${formatUAH(unit, locale)} × ${s.quantity} ${t.pcs} · ` : ""}{t.production}</small>
          </div>
          <button type="button" onClick={buy} disabled={!canBuy} aria-describedby={buyHint ? "k-buy-hint" : undefined} className="h-[52px] rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] disabled:opacity-50">{t.buy}</button>
        </div>
        {buyHint && <p id="k-buy-hint" role="status" className="m-0 text-sm text-[var(--muted)]">{buyHint}</p>}
        <p className="m-0 text-[13px] text-[var(--muted)]">{t.checkNote}</p>
        <DraftLinkButton link={draft.link} note={t.draftNote} />
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--bg)] px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] lg:hidden">
        <b className="text-xl tabular-nums">{formatUAH(total, locale)}{buyHint && <small className="block text-[12px] font-normal text-[var(--muted)]">{t.calculating}</small>}</b>
        <button type="button" onClick={buy} disabled={!canBuy} aria-describedby={buyHint ? "k-buy-hint" : undefined} className="h-12 rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] disabled:opacity-50">{t.buy}</button>
      </div>
    </div>
  );
}
