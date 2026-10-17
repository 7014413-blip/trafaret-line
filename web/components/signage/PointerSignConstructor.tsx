"use client";

// «Табличка-вказівник» constructor (Денис 2026-10-10): a two-layer raised pointer sign.
// The customer changes the text lines and their fonts (shop fonts and their own), the base
// material and colour, the text colour, adds a logo and sets the direction of the tip and
// of the small arrow. Preview and price change at once; sizes in cm, prices in UAH only.
// Layout: lib/pointer-sign/layout.ts, price: lib/pointer-sign/price.ts (repeated on the server).

import Link from "@/components/i18n/LocaleLink";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useEffect, useState } from "react";
import { BuyPanel } from "@/components/signage/BuyPanel";
import { ConstructorHeader } from "@/components/signage/ConstructorHeader";
import { DesignChecks } from "@/components/signage/DesignChecks";
import { LogoFileField } from "@/components/signage/LogoFileField";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { PlaqueLinesEditor } from "@/components/signage/PlaqueLinesEditor";
import { PointerMaterialPicker } from "@/components/signage/PointerMaterialPicker";
import { PointerSignPreview } from "@/components/signage/PointerSignPreview";
import { QuantityField } from "@/components/signage/QuantityField";
import { SizePresetPicker } from "@/components/signage/SizePresetPicker";
import { FIELDSET_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { ensureLogoUploaded } from "@/lib/client/ensure-logo-uploaded";
import { readPointerShapeParam } from "@/lib/client/pointer-shape-param";
import { LOGO_ACCEPT, readLogoFile } from "@/lib/client/read-logo-file";
import { useBuyState } from "@/lib/client/use-buy-state";
import { useDispatchLabel } from "@/lib/client/use-dispatch-label";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { usePresetSize } from "@/lib/client/use-preset-size";
import { pointerThumbnailSvg } from "@/lib/export/pointer-thumbnail";
import { cmText } from "@/lib/format";
import { SIGNAGE } from "@/lib/i18n/dictionaries/signage";
import { SIGNAGE_PLAQUES } from "@/lib/i18n/dictionaries/signage-plaques";
import { tr } from "@/lib/i18n/translate";
import { checkPointerSign } from "@/lib/pointer-sign/check";
import { clampPointerSizeMm } from "@/lib/pointer-sign/clamp-size";
import { DEFAULT_POINTER_SIGN_CONFIG } from "@/lib/pointer-sign/config";
import { findPointerMaterial } from "@/lib/pointer-sign/find-material";
import { computePointerLayout } from "@/lib/pointer-sign/layout";
import { pricePointerSign } from "@/lib/pointer-sign/price";
import { useCart } from "@/store/cart-store";
import type {
  PointerArrowPlacement, PointerDirection, PointerLogo, PointerShape, PointerSignDesign, PointerTextLine,
} from "@/types/pointer-sign";

const CFG = DEFAULT_POINTER_SIGN_CONFIG;
// Fonts and sizes of the example lines; their texts come in the page language.
const FIRST_LINES: Omit<PointerTextLine, "text">[] = [
  { fontId: "roboto-slab", size: 1.3 },
  { fontId: "rubik", size: 0.8 },
];
const ARROWS: PointerArrowPlacement[] = ["start", "end", "none"];

type LogoState = Omit<PointerLogo, "uploadKey"> & { file: File; previewUrl: string; uploadKey: string | null };

const clampSize = (widthMm: number, heightMm: number) => clampPointerSizeMm(widthMm, heightMm, CFG);

export function PointerSignConstructor() {
  const locale = useLocale();
  const s = tr(SIGNAGE, locale);
  const t = tr(SIGNAGE_PLAQUES, locale);
  const p = t.pointer;
  const sizeState = usePresetSize(CFG.presets, { w: 40, h: 15 }, clampSize);
  const { sizeCode, size } = sizeState;
  const [direction, setDirection] = useState<PointerDirection>(-1);
  const [shape, setShape] = useState<PointerShape>("pointer");
  const [baseId, setBaseId] = useState("black");
  const [overlayId, setOverlayId] = useState("white");
  const text = usePlaqueLines(FIRST_LINES.map((l, i) => ({ ...l, text: p.startLines[i] })), CFG.maxLines);
  const lines = text.lines;
  const [arrowPlacement, setArrowPlacement] = useState<PointerArrowPlacement>("start");
  const [arrowLine, setArrowLine] = useState(1);
  const [logo, setLogo] = useState<LogoState | null>(null);
  const [logoError, setLogoError] = useState("");
  const [qty, setQty] = useState(1);
  const buyState = useBuyState();
  const dispatch = useDispatchLabel(locale);
  const cart = useCart();

  useEffect(() => {
    const shapeFromLink = readPointerShapeParam();
    if (shapeFromLink === "arrow") { setShape("arrow"); setArrowPlacement("none"); }
  }, []);

  // Revoke the preview URL of a replaced or removed logo.
  const logoUrl = logo?.previewUrl ?? null;
  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl); }, [logoUrl]);

  const measured = text.measured;

  const design: PointerSignDesign = {
    sizeCode, widthMm: size.widthMm, heightMm: size.heightMm, direction, shape,
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
  const price = pricePointerSign(design, undefined, undefined, locale);
  const base = findPointerMaterial(baseId);
  const overlay = findPointerMaterial(overlayId);
  const canBuy = errors.length === 0 && fontsReady;

  const onLineRemoved = (i: number) => setArrowLine((a) => (a > i ? a - 1 : a === i ? 0 : a));

  const pickLogo = async (file: File | undefined) => {
    setLogoError("");
    if (!file) return;
    const result = await readLogoFile(file);
    if (!result.ok) { setLogoError(result.error); return; }
    setLogo({ file: result.file, previewUrl: result.previewUrl, fileName: file.name, format: result.format, aspect: result.aspect, invert: false, ring: true, uploadKey: null });
  };

  const buy = async () => {
    if (!canBuy || buyState.state === "uploading") return;
    const upload = await ensureLogoUploaded(logo, setLogo, buyState);
    if (!upload.ok) return;
    const { uploadKey } = upload;
    const final: PointerSignDesign = { ...design, logo: design.logo ? { ...design.logo, uploadKey } : null };
    const texts = final.lines.map((l) => l.text).filter(Boolean).join(" / ");
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `pointer|${JSON.stringify({ ...final, quantity: 0 })}`,
      title: p.cartTitle(texts, `${cmText(final.widthMm)}×${cmText(final.heightMm)}`),
      materialId: "acrylic_5",
      widthCm: final.widthMm / 10,
      heightCm: final.heightMm / 10,
      quantity: qty,
      kind: "pointer",
      pointer: final,
      basePrice: price.internal.basePrice,
      vectorSvg: pointerThumbnailSvg(layout, linePaths, base.hex, overlay.hex),
    });
    buyState.added();
  };

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label={t.previewRegion} className="self-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[#f3f1ec] lg:sticky lg:top-24">
        <PointerSignPreview layout={layout} linePaths={linePaths} base={base} overlay={overlay}
          logo={logo ? { url: logo.previewUrl, invert: logo.invert } : null} label={p.previewLabel(`${cmText(size.widthMm)}×${cmText(size.heightMm)}`)} />
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{cmText(size.widthMm)} × {cmText(size.heightMm)} см · {p.tip(direction === -1)}</span>
          <span>{base.name[locale]} {base.baseThicknessMm} мм + {overlay.name[locale].toLowerCase()} {overlay.overlayThicknessMm} мм</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <ConstructorHeader kicker={p.kicker} title={p.title} lead={p.lead} />

        <SizePresetPicker idPrefix="ps" presets={CFG.presets} priceOf={(p) => p.price} state={sizeState} limits={CFG}
          note={<>{p.sizeNoteStart(cmText(CFG.minWidthMm), cmText(CFG.maxWidthMm), Math.round(CFG.maxHeightToWidth * 100))}<Link href="/vyvisky" className="underline">{p.signConstructor}</Link>.</>} />

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{p.shape}</legend>
          <div className="flex flex-wrap gap-2">
            <PlaqueChip id="ps-shape-pointer" on={shape === "pointer"} onClick={() => setShape("pointer")}>{p.shapePointer}</PlaqueChip>
            <PlaqueChip id="ps-shape-arrow" on={shape === "arrow"} onClick={() => { setShape("arrow"); setArrowPlacement("none"); }}>{p.shapeArrow}</PlaqueChip>
          </div>
          <span className="text-[13px] text-[var(--muted)]">{shape === "arrow" ? p.shapeArrowNote : p.shapePointerNote}{p.samePrice}</span>
        </fieldset>

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{p.direction}</legend>
          <div className="flex flex-wrap gap-2">
            <PlaqueChip id="ps-dir-left" on={direction === -1} onClick={() => setDirection(-1)}>{p.left}</PlaqueChip>
            <PlaqueChip id="ps-dir-right" on={direction === 1} onClick={() => setDirection(1)}>{p.right}</PlaqueChip>
          </div>
          <span className="text-[13px] text-[var(--muted)]">{p.directionNote}</span>
        </fieldset>

        <PlaqueLinesEditor state={text} legend={s.text} idPrefix="ps" maxChars={CFG.maxLineChars} onRemove={onLineRemoved}
          capByLine={new Map(layout.lines.map((l) => [l.index, l.capMm]))} />

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{p.smallArrow}</legend>
          <div className="flex flex-wrap gap-2">{ARROWS.map((v) => <PlaqueChip key={v} id={`ps-arrow-${v}`} on={arrowPlacement === v} onClick={() => setArrowPlacement(v)}>{p.arrows[v]}</PlaqueChip>)}</div>
          {arrowPlacement !== "none" && lines.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {lines.map((_, i) => <PlaqueChip key={i} id={`ps-arrow-line-${i}`} on={design.arrow.lineIndex === i} onClick={() => setArrowLine(i)}>{p.inLine(i + 1)}</PlaqueChip>)}
            </div>
          )}
        </fieldset>

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{s.logo}</legend>
          <LogoFileField inputId="ps-logo" accept={LOGO_ACCEPT} fileName={logo?.fileName ?? null} onPick={pickLogo} onRemove={() => setLogo(null)}
            emptyHint={p.logoHint} error={logoError}>
            {logo && (
              <>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="ps-logo-ring" checked={logo.ring} onChange={(e) => setLogo({ ...logo, ring: e.target.checked })} className="accent-[var(--ink)]" />{p.logoRing}</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="ps-logo-invert" checked={logo.invert} onChange={(e) => setLogo({ ...logo, invert: e.target.checked })} className="accent-[var(--ink)]" />{s.logoInvert}</label>
                <span className="text-[13px] text-[var(--muted)]">{p.logoNote}</span>
              </>
            )}
          </LogoFileField>
        </fieldset>

        <PointerMaterialPicker legend={s.base} value={baseId} onChange={setBaseId} idPrefix="ps-base" />
        <PointerMaterialPicker legend={p.overlay} value={overlayId} onChange={setOverlayId} idPrefix="ps-over" />

        <QuantityField idPrefix="ps" value={qty} onChange={setQty} />

        <DesignChecks checks={checks} />

        <BuyPanel lines={price.lines.map(({ label }) => ({ label }))} total={price.total} unitPrice={price.unitPrice} qty={qty} note={price.needsManager ? s.managerConfirms : dispatch}
          state={buyState.state} message={buyState.message} canBuy={canBuy} onBuy={buy} />
      </form>
    </div>
  );
}
