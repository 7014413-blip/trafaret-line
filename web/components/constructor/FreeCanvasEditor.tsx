"use client";

// «Вільне полотно»: several texts and shapes on one stencil sheet. The layout is kept in
// the browser (localStorage) until the customer buys it; the analysis (cut, bridges,
// problems) and the price are recomputed after every change.

import { useEffect, useMemo, useState } from "react";
import { LEGEND_CLASS } from "@/components/ui/form-classes";
import { FontOptions } from "@/components/constructor/FontOptions";
import { useCart } from "@/store/cart-store";
import { MATERIALS, stencilMaterials, WELD_MATERIALS } from "@/lib/materials";
import { priceStencil, priceWelded } from "@/lib/calculators/pricing";
import { weldThumbnailSvg } from "@/lib/export/cart-thumbnail";
import { formatUAH } from "@/lib/format";
import { computeCanvasAnalysis } from "@/lib/client/geometry-client";
import { shapeOutline } from "@/lib/geometry/shapes";
import { stencilThumbnailSvg } from "@/lib/export/cart-thumbnail";
import { loadFont, loadFontManifest, registerLoadedFont, type FontEntry, type LoadedFont } from "@/lib/text/font-loader";
import { listCustomFonts } from "@/lib/client/custom-fonts";
import { fontEntry } from "@/lib/text/font-entry";
import { useHistory } from "@/lib/client/use-history";
import { CustomFontPanel } from "./CustomFontPanel";
import { textToDesign } from "@/lib/text/text-layout";
import type { CanvasAnalysis, CanvasElement, CanvasResultMode, CanvasSettings, CanvasShapeKind, CanvasTransform } from "@/types/canvas";
import type { MaterialOption, MaterialType } from "@/types/customizer";
import type { Vec2 } from "@/types/geometry";
import { Canvas2D } from "./Canvas2D";

const STORAGE_KEY = "tl-free-canvas-v1";
const DEFAULT_SETTINGS: CanvasSettings = {
  sheetWidthMm: 400, sheetHeightMm: 300, marginMm: 15, gridMm: 5, snapToGrid: true, showGrid: true, materialId: "polystyrene",
};
const SHAPES: [CanvasShapeKind, string][] = [["circle", "Коло"], ["rect", "Прямокутник"], ["star", "Зірка"], ["heart", "Серце"], ["frame", "Рамка"]];
const TEXT_CAP_MM = 30;
const RESULT_MODES: [CanvasResultMode, string, string][] = [
  ["stencil", "Трафарет", "Елементи вирізаються з аркуша, перемички ставимо самі"],
  ["piece", "Цілим шматком", "Елементи стають однією деталлю з акрилу: топпер, напис, вивіска"],
];

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`);
const field = "h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-base text-[var(--ink)]";

interface Stored {
  settings: CanvasSettings;
  elements: CanvasElement[];
}

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    return parsed && Array.isArray(parsed.elements) && parsed.settings ? parsed : null;
  } catch {
    return null;
  }
}

export function FreeCanvasEditor() {
  const cart = useCart();
  const [settings, setSettings] = useState<CanvasSettings>(DEFAULT_SETTINGS);
  // Elements with undo / redo (Ctrl+Z, Ctrl+Shift+Z or Ctrl+Y), 50 steps.
  const history = useHistory<CanvasElement[]>([]);
  const elements = history.value;
  const setElements = history.set;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) { e.preventDefault(); history.undo(); }
      else if ((key === "z" && e.shiftKey) || key === "y") { e.preventDefault(); history.redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history.undo, history.redo]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shopFonts, setFonts] = useState<FontEntry[]>([]);
  const [customFonts, setCustomFonts] = useState<LoadedFont[]>([]);
  const fonts = useMemo<FontEntry[]>(() => [...shopFonts, ...customFonts.map(fontEntry)], [shopFonts, customFonts]);
  const [fontId, setFontId] = useState("");
  const [text, setText] = useState("Кава");
  const [quantity, setQuantity] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setSettings(stored.settings);
      history.replace(stored.elements);
    }
    setLoaded(true);
    loadFontManifest()
      .then((list) => {
        setFonts(list);
        setFontId((current) => current || list[0]?.id || "");
      })
      .catch(() => setError("Не вдалося завантажити шрифти. Оновіть сторінку."));
    // The customer's own fonts: each text element can use any of them.
    listCustomFonts().then((list) => { list.forEach(registerLoadedFont); setCustomFonts(list); }).catch(() => setCustomFonts([]));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, elements }));
    } catch {
      // Storage full or disabled: the layout simply is not remembered.
    }
  }, [loaded, settings, elements]);

  // Cut, bridges and problems are computed in the geometry worker after every change.
  const [analysis, setAnalysis] = useState<CanvasAnalysis | null>(null);
  const [analysing, setAnalysing] = useState(false);
  useEffect(() => {
    if (!elements.length) {
      setAnalysis(null);
      return;
    }
    let live = true;
    setAnalysing(true);
    computeCanvasAnalysis(elements, settings)
      .then((result) => { if (live) setAnalysis(result); })
      .catch(() => { if (live) setError("Не вдалося перевірити макет. Оновіть сторінку."); })
      .finally(() => { if (live) setAnalysing(false); });
    return () => { live = false; };
  }, [elements, settings]);
  const material = MATERIALS[settings.materialId];
  const sheet = { shape: "rect" as const, widthMm: settings.sheetWidthMm, heightMm: settings.sheetHeightMm };
  // «Цілим шматком»: priced like a welded word by the size of the piece (ТЗ v0.9 §5).
  const pieceMode = settings.result === "piece";
  const pieceBox = analysis?.piece?.bbox;
  const pieceW = pieceBox ? pieceBox.maxX - pieceBox.minX : 0;
  const pieceH = pieceBox ? pieceBox.maxY - pieceBox.minY : 0;
  const priceFor = (m: MaterialOption, q: number) => (pieceMode ? priceWelded(Math.max(1, pieceW), Math.max(1, pieceH), m, q) : priceStencil(sheet, m, q));
  const price = priceFor(material, quantity);
  const materialChoices = pieceMode
    ? WELD_MATERIALS.map((id) => MATERIALS[id]).filter((m) => m.baseSquareMeterPrice != null)
    : stencilMaterials();
  const setResultMode = (mode: CanvasResultMode) => setSettings((s) => {
    const list = mode === "piece" ? WELD_MATERIALS : stencilMaterials().map((m) => m.id);
    return { ...s, result: mode, materialId: list.includes(s.materialId) ? s.materialId : list[0] };
  });
  const errors = analysis?.issues.filter((i) => i.level === "error") ?? [];
  const warnings = analysis?.issues.filter((i) => i.level === "warning") ?? [];
  const selected = elements.find((e) => e.id === selectedId) ?? null;
  const canBuy = elements.length > 0 && !analysing && !!analysis && errors.length === 0 && !price.priceOnRequest;

  /** Places a new element in the middle of the free area, scaled down to fit inside the margin. */
  const place = (widthMm: number, heightMm: number): CanvasTransform => {
    const room = Math.min((settings.sheetWidthMm - 2 * settings.marginMm) / widthMm, (settings.sheetHeightMm - 2 * settings.marginMm) / heightMm, 1);
    const scale = Math.max(0.05, room);
    return {
      x: (settings.sheetWidthMm - widthMm * scale) / 2,
      y: (settings.sheetHeightMm - heightMm * scale) / 2,
      scale,
      angle: 0,
    };
  };

  const addText = async () => {
    const entry = fonts.find((f) => f.id === fontId) ?? fonts[0];
    if (!entry || !text.trim()) return;
    setBusy(true);
    setError("");
    try {
      const font = await loadFont(entry);
      const layout = textToDesign(font, text, { align: "center" });
      const k = TEXT_CAP_MM / Math.max(1, layout.capUnits);
      const groups = layout.glyphs
        .filter((g) => g.contours.length)
        .map((g) => g.contours.map((c) => c.map(([x, y]) => [x * k, y * k] as Vec2)));
      const widthMm = layout.design.bboxMm.w * k;
      const heightMm = layout.design.bboxMm.h * k;
      const element: CanvasElement = {
        id: newId(), kind: "text", text: text.trim(), fontId: entry.id, capMm: TEXT_CAP_MM,
        groups, widthMm, heightMm, transform: place(widthMm, heightMm), locked: false,
      };
      setElements((list) => [...list, element]);
      setSelectedId(element.id);
    } catch {
      setError("Не вдалося підготувати текст цим шрифтом. Оберіть інший шрифт.");
    } finally {
      setBusy(false);
    }
  };

  const addShape = (shape: CanvasShapeKind) => {
    const outline = shapeOutline(shape, 80);
    const element: CanvasElement = {
      id: newId(), kind: "shape", shape, groups: outline.groups, widthMm: outline.widthMm, heightMm: outline.heightMm,
      transform: place(outline.widthMm, outline.heightMm), locked: false,
    };
    setElements((list) => [...list, element]);
    setSelectedId(element.id);
  };

  const updateTransform = (id: string, transform: CanvasTransform) =>
    setElements((list) => list.map((e) => (e.id === id ? { ...e, transform } : e)));

  const removeSelected = () => {
    if (!selectedId) return;
    setElements((list) => list.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy: CanvasElement = { ...selected, id: newId(), transform: { ...selected.transform, x: selected.transform.x + 10, y: selected.transform.y + 10 } };
    setElements((list) => [...list, copy]);
    setSelectedId(copy.id);
  };

  const toggleLock = () => {
    if (!selected) return;
    setElements((list) => list.map((e) => (e.id === selected.id ? { ...e, locked: !e.locked } : e)));
  };

  const setSheet = (patch: Partial<CanvasSettings>) => setSettings((s) => ({ ...s, ...patch }));

  const buy = () => {
    if (!canBuy || !analysis) return;
    const names = elements.map((e) => (e.kind === "text" ? `«${e.text}»` : SHAPES.find(([k]) => e.kind === "shape" && k === e.shape)?.[1] ?? "фігура"));
    const elementSpec = elements.map((e) => ({ kind: e.kind, transform: e.transform, ...(e.kind === "text" ? { text: e.text, fontId: e.fontId, capMm: e.capMm } : {}), ...(e.kind === "shape" ? { shape: e.shape } : {}) }));
    const key = `c|${settings.result ?? "stencil"}|${JSON.stringify(elements.map((e) => [e.id, e.transform]))}|${settings.sheetWidthMm}|${settings.sheetHeightMm}|${settings.materialId}|${settings.autoJoin ? 1 : 0}`;
    if (pieceMode && analysis.piece) {
      const w = Math.round(pieceW);
      const h = Math.round(pieceH);
      const shifted = analysis.piece.shapes.map((poly) => poly.map(([x, y]) => [x - (pieceBox?.minX ?? 0), y - (pieceBox?.minY ?? 0)] as Vec2));
      cart.add({
        key,
        kind: "welded",
        title: `Виріб цілим шматком з полотна: ${names.join(", ")}`,
        materialId: settings.materialId,
        widthCm: w / 10,
        heightCm: h / 10,
        quantity,
        section: "sweet",
        vectorSvg: weldThumbnailSvg(w, h, shifted, MATERIALS[settings.materialId].colours[0]?.hex ?? MATERIALS[settings.materialId].look.face),
        spec: { source: "free-canvas", result: "piece", autoJoin: settings.autoJoin === true, piece: { widthMm: w, heightMm: h }, elements: elementSpec },
      });
      return;
    }
    cart.add({
      key,
      kind: "stencil",
      title: `Трафарет з полотна: ${names.join(", ")}`,
      materialId: settings.materialId,
      widthCm: settings.sheetWidthMm / 10,
      heightCm: settings.sheetHeightMm / 10,
      quantity,
      section: "interior",
      vectorSvg: stencilThumbnailSvg(settings.sheetWidthMm, settings.sheetHeightMm, analysis.cut.cutPaths, MATERIALS[settings.materialId].look.face),
      spec: {
        source: "free-canvas",
        sheet: { widthMm: settings.sheetWidthMm, heightMm: settings.sheetHeightMm, marginMm: settings.marginMm },
        elements: elementSpec,
        bridges: analysis.cut.bridges.length,
      },
    });
  };

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label="Полотно" className="self-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] lg:sticky lg:top-24">
        <Canvas2D settings={settings} elements={elements} analysis={analysis} selectedId={selectedId} onSelect={setSelectedId} onTransform={updateTransform} className="w-full" />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{settings.sheetWidthMm / 10} × {settings.sheetHeightMm / 10} см · сітка {settings.gridMm} мм · {analysing ? "перевіряємо…" : `перемичок ${analysis?.cut.bridges.length ?? 0}`}</span>
          <span className="flex gap-1.5">
            <button type="button" onClick={duplicateSelected} disabled={!selected} className="rounded-lg border border-[var(--line)] px-2.5 py-1 disabled:opacity-40">Копія</button>
            <button type="button" onClick={toggleLock} disabled={!selected} className="rounded-lg border border-[var(--line)] px-2.5 py-1 disabled:opacity-40">{selected?.locked ? "Розблокувати" : "Закріпити"}</button>
            <button type="button" onClick={removeSelected} disabled={!selected} className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-[var(--danger)] disabled:opacity-40">Видалити</button>
            <button type="button" onClick={history.undo} disabled={!history.canUndo} title="Ctrl+Z" className="rounded-lg border border-[var(--line)] px-2.5 py-1 disabled:opacity-40">↶ Скасувати</button>
            <button type="button" onClick={history.redo} disabled={!history.canRedo} title="Ctrl+Shift+Z" className="rounded-lg border border-[var(--line)] px-2.5 py-1 disabled:opacity-40">↷ Повторити</button>
          </span>
        </div>
      </section>

      <div className="grid content-start gap-5">
        <header>
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Конструктор</p>
          <h1 className="m-0 mt-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,34px)] font-bold leading-tight">Вільне полотно</h1>
          <p className="m-0 mt-1 text-[var(--muted)]">Розставте написи і фігури на одному трафареті. Перемички ставимо самі, проблемні місця підсвічуємо.</p>
        </header>

        <fieldset className="grid gap-2">
          <legend className={LEGEND_CLASS}>Додати напис</legend>
          <input id="fc-text" value={text} maxLength={60} onChange={(e) => setText(e.target.value)} className={field} aria-label="Текст напису" />
          <div className="flex gap-2">
            <select id="fc-font" value={fontId} onChange={(e) => setFontId(e.target.value)} className={`${field} min-w-0 flex-1`} aria-label="Шрифт">
              <FontOptions fonts={fonts} current={fontId} />
            </select>
            <button type="button" onClick={addText} disabled={busy || !fonts.length || !text.trim()} className="h-11 rounded-full bg-[var(--buy)] px-5 font-bold text-[var(--buy-fg)] disabled:opacity-50">Додати</button>
          </div>
          <CustomFontPanel fonts={customFonts} text={text}
            onAdded={(added) => { registerLoadedFont(added); setCustomFonts((list) => [...list.filter((f) => f.id !== added.id), added]); setFontId(added.id); }}
            onRemoved={(removed) => { setCustomFonts((list) => list.filter((f) => f.id !== removed)); if (fontId === removed) setFontId(shopFonts[0]?.id ?? ""); }} />
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className={LEGEND_CLASS}>Додати фігуру</legend>
          <div className="flex flex-wrap gap-2">
            {SHAPES.map(([kind, label]) => (
              <button key={kind} type="button" onClick={() => addShape(kind)} className="rounded-full border-[1.5px] border-[var(--line)] px-3 py-1.5 text-sm">{label}</button>
            ))}
          </div>
        </fieldset>

        <fieldset className="grid grid-cols-2 gap-2">
          <legend className={LEGEND_CLASS}>Аркуш</legend>
          <label className="grid gap-1 text-sm text-[var(--muted)]">Ширина, см
            <input id="fc-w" type="number" min={10} max={140} value={settings.sheetWidthMm / 10} onChange={(e) => setSheet({ sheetWidthMm: Math.max(100, Math.min(1400, Number(e.target.value) * 10)) })} className={field} />
          </label>
          <label className="grid gap-1 text-sm text-[var(--muted)]">Висота, см
            <input id="fc-h" type="number" min={10} max={200} value={settings.sheetHeightMm / 10} onChange={(e) => setSheet({ sheetHeightMm: Math.max(100, Math.min(2000, Number(e.target.value) * 10)) })} className={field} />
          </label>
          <label className="grid gap-1 text-sm text-[var(--muted)]">Сітка, мм
            <select id="fc-grid" value={settings.gridMm} onChange={(e) => setSheet({ gridMm: Number(e.target.value) })} className={field}>
              {[1, 2, 5, 10].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-[var(--muted)]">Відступ від краю, мм
            <input id="fc-margin" type="number" min={5} max={50} value={settings.marginMm} onChange={(e) => setSheet({ marginMm: Math.max(5, Math.min(50, Number(e.target.value))) })} className={field} />
          </label>
          <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" id="fc-snap" checked={settings.snapToGrid} onChange={(e) => setSheet({ snapToGrid: e.target.checked })} className="accent-[var(--ink)]" />Прилипати до сітки</label>
          <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" id="fc-showgrid" checked={settings.showGrid} onChange={(e) => setSheet({ showGrid: e.target.checked })} className="accent-[var(--ink)]" />Показувати сітку</label>
        </fieldset>

        <fieldset role="radiogroup" aria-labelledby="fc-result-legend" className="grid gap-2 sm:grid-cols-2">
          <legend id="fc-result-legend" className={LEGEND_CLASS}>Що робимо</legend>
          {RESULT_MODES.map(([mode, title, hint]) => (
            <label key={mode} className={`grid cursor-pointer gap-0.5 rounded-xl border-[1.5px] px-3.5 py-3 ${(settings.result ?? "stencil") === mode ? "border-[var(--ink)]" : "border-[var(--line)]"} bg-[var(--card)]`}>
              <span className="flex items-center gap-2">
                <input type="radio" name="fc-result" id={`fc-result-${mode}`} value={mode} checked={(settings.result ?? "stencil") === mode} onChange={() => setResultMode(mode)} className="h-[18px] w-[18px] accent-[var(--ink)]" />
                <b>{title}</b>
              </span>
              <span className="text-[13px] text-[var(--muted)]">{hint}</span>
            </label>
          ))}
          {pieceMode && (
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" id="fc-autojoin" checked={settings.autoJoin === true} onChange={(e) => setSheet({ autoJoin: e.target.checked })} className="h-4 w-4 accent-[var(--ink)]" />
              З&apos;єднати автоматично: короткі прямі перемички між частинами
            </label>
          )}
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className={LEGEND_CLASS}>Матеріал</legend>
          {materialChoices.map((m) => (
            <label key={m.id} className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-3 ${settings.materialId === m.id ? "border-[var(--ink)]" : "border-[var(--line)]"} bg-[var(--card)]`}>
              <input type="radio" name="fc-mat" id={`fc-mat-${m.id}`} checked={settings.materialId === m.id} onChange={() => setSheet({ materialId: m.id as MaterialType })} className="h-[18px] w-[18px] accent-[var(--ink)]" />
              <span><b className="block">{m.name.uk}</b><span className="text-[13px] text-[var(--muted)]">{m.note.uk}</span></span>
              <em className="not-italic font-semibold tabular-nums">{pieceMode && !pieceBox ? "" : formatUAH(priceFor(m, 1).unitPrice)}</em>
            </label>
          ))}
        </fieldset>

        {(errors.length > 0 || warnings.length > 0 || error) && (
          <ul role="status" className="m-0 grid list-none gap-1.5 rounded-xl bg-[var(--surface)] p-3 text-sm">
            {error && <li className="text-[var(--danger)]">{error}</li>}
            {errors.map((issue, i) => <li key={`e${i}`} className="text-[var(--danger)]">{issue.message}</li>)}
            {warnings.map((issue, i) => <li key={`w${i}`} className="text-[var(--muted)]">{issue.message}</li>)}
          </ul>
        )}

        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Менше" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">−</button>
          <input id="fc-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(9999, Math.round(Number(e.target.value) || 1))))} aria-label="Кількість" className="h-10 w-16 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
          <button type="button" aria-label="Більше" onClick={() => setQuantity((q) => Math.min(9999, q + 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">+</button>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface)] p-4">
          <div className="text-[30px] font-extrabold leading-none tabular-nums">{formatUAH(price.total)}
            <small className="mt-1 block text-[13px] font-normal text-[var(--muted)]">{quantity > 1 ? `${formatUAH(price.unitPrice)} × ${quantity} шт. · ` : ""}виготовлення 3 робочі дні</small>
          </div>
          <button type="button" onClick={buy} disabled={!canBuy} className="h-[52px] rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] disabled:opacity-50">Купити</button>
        </div>
      </div>
    </div>
  );
}
