"use client";

// Acrylic sign constructor (research/konstruktor-vyvesok.md §2, §9): shape, size,
// base sheet and thickness, text overlay layer with its own colour and font, frame,
// mounting holes, options, quantity. Price and checks from lib/signage-math (priceSign,
// checkSign); the customer sees sizes and UAH only, never m².

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ACRYLIC_PALETTE, baseSize, checkSign, priceSign, signHoles, signOutline } from "@/lib/calculators/signage";
import { formatUAH } from "@/lib/format";
import { loadFont, loadFontManifest, type FontEntry, type LoadedFont } from "@/lib/text/font-loader";
import { textToDesign, type TextDesignResult } from "@/lib/text/text-layout";
import { useCart } from "@/store/cart-store";
import type { SignDesign, SignShape } from "@/types/signage";

const SHAPES: [SignShape, string][] = [["rect", "Прямокутник"], ["rounded", "Заокруглений"], ["circle", "Коло"], ["square", "Квадрат"], ["arrow", "Стрілка"], ["pointer", "Вказівник"]];
const SIZES: Record<SignShape, [number, number][]> = {
  rect: [[400, 200], [600, 300], [800, 400], [1000, 500]], rounded: [[400, 200], [600, 300], [800, 400]],
  circle: [[300, 300], [400, 400], [600, 600]], square: [[300, 300], [400, 400], [500, 500]],
  arrow: [[500, 200], [700, 250], [900, 300]], pointer: [[500, 150], [700, 200], [900, 250]],
};
const sheet = (id: string) => ACRYLIC_PALETTE.find((p) => p.id === id)!;

function Swatch({ id, active, onPick }: { id: string; active: boolean; onPick: () => void }) {
  const s = sheet(id);
  const bg = s.finish === "mirror" ? `linear-gradient(135deg, #f8fafc, ${s.hex} 45%, #f8fafc 60%, ${s.hex})` : s.hex;
  return (
    <button type="button" onClick={onPick} aria-pressed={active} title={s.name.uk}
      className={`relative h-10 w-10 rounded-full border-2 ${active ? "border-[var(--ink)] ring-2 ring-[var(--ink)] ring-offset-2" : "border-[var(--line)]"}`} style={{ background: bg }}>
      {!s.inStock && <span className="absolute -bottom-1 -right-1 rounded-full bg-[var(--card)] px-1 text-[9px] text-[var(--muted)]">зам.</span>}
      <span className="sr-only">{s.name.uk}</span>
    </button>
  );
}

const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" aria-pressed={on} onClick={onClick}
    className={`h-10 rounded-full border-[1.5px] px-3.5 text-sm tabular-nums ${on ? "border-[var(--ink)] bg-[var(--surface)] font-bold" : "border-[var(--line)] bg-[var(--card)]"}`}>{children}</button>
);

export function SignConstructor() {
  const [shape, setShape] = useState<SignShape>("rect");
  const [w, setW] = useState(600);
  const [h, setH] = useState(300);
  const [baseId, setBaseId] = useState("black");
  const [thick, setThick] = useState(3);
  const [text, setText] = useState("КАВʼЯРНЯ");
  const [textId, setTextId] = useState("mirror-gold");
  const [cap, setCap] = useState(80);
  const [frame, setFrame] = useState(true);
  const [holes, setHoles] = useState<0 | 2 | 4>(4);
  const [adhesive, setAdhesive] = useState(false);
  const [template, setTemplate] = useState(false);
  const [qty, setQty] = useState(1);
  const [fonts, setFonts] = useState<FontEntry[]>([]);
  const [fontId, setFontId] = useState("montserrat");
  const [font, setFont] = useState<LoadedFont | null>(null);
  const [res, setRes] = useState<TextDesignResult | null>(null);
  const cart = useCart();

  useEffect(() => { loadFontManifest().then(setFonts); }, []);
  useEffect(() => { const e = fonts.find((f) => f.id === fontId); if (e) loadFont(e).then(setFont); }, [fonts, fontId]);
  useEffect(() => { if (font) setRes(textToDesign(font, text || " ", { align: "center" })); }, [font, text]);

  const base = { shape, widthMm: w, heightMm: shape === "circle" || shape === "square" ? w : h, direction: 1 as const, materialId: baseId, thicknessMm: thick };
  const { w: bw, h: bh } = baseSize(base);
  const inset = 18, fw = 6;
  // Keep the text inside the frame: if it would not fit, lower the letter height.
  const maxCap = res && text.trim()
    ? Math.floor(Math.min(
        (bw * (shape === "arrow" || shape === "pointer" ? 0.6 : shape === "circle" ? 0.68 : 1) - 2 * (inset + fw + 12)) * res.capUnits / Math.max(1, res.design.bboxMm.w),
        (bh - 2 * (inset + fw + 12)) * res.capUnits / Math.max(1, res.design.bboxMm.h),
      ))
    : 400;
  useEffect(() => { if (cap > maxCap && maxCap >= 15) setCap(maxCap); }, [maxCap]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = res ? cap / Math.max(1, res.capUnits) : 1;
  const tw = res ? res.design.bboxMm.w * s : 0, th = res ? res.design.bboxMm.h * s : 0;

  const design: SignDesign = useMemo(() => ({
    mode: "sign", base, quantity: qty,
    options: { holes, selfAdhesive: adhesive, positioningStencil: template, whiteLabel: false },
    layers: [
      ...(text.trim() ? [{ id: "t1", kind: "text" as const, materialId: textId, thicknessMm: 2 as const, x: 0, y: 0, text, fontId, capHeightMm: cap, bbox: { x: -tw / 2, y: -th / 2, width: tw, height: th } }] : []),
      ...(frame ? [{ id: "f1", kind: "frame" as const, materialId: textId, thicknessMm: 2 as const, x: 0, y: 0, frameWidthMm: fw, frameInsetMm: inset }] : []),
    ],
  }), [shape, w, h, baseId, thick, text, textId, cap, frame, holes, adhesive, template, qty, tw, th, fontId]); // eslint-disable-line react-hooks/exhaustive-deps

  const price = priceSign(design);
  const checks = checkSign(design);
  const holePts = signHoles(base, holes);
  const outline = signOutline(base).map(([x, y]) => `${x - bw / 2},${y - bh / 2}`).join(" ");
  const fill = (id: string) => (sheet(id).finish === "mirror" ? `url(#m-${id})` : sheet(id).hex);
  const pad = Math.max(bw, bh) * 0.08;
  const thicknesses = sheet(baseId).finish === "mirror" ? [2, 3] : [3, 6, 8];
  const errors = checks.filter((c) => c.level === "error");

  const buy = () => cart.add({ key: `sign|${shape}|${bw}x${bh}|${baseId}|${thick}|${text}|${textId}|${holes}|${adhesive}|${template}`,
    title: `Вивіска «${text}», ${shape === "circle" ? `Ø${bw}` : `${bw}×${bh}`} мм`, materialId: "acrylic", widthCm: bw / 10, heightCm: bh / 10, quantity: qty, fixedPrice: price.unitPrice, kind: "sign", sign: design });

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label="Превʼю вивіски" className="self-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[#f3f1ec] lg:sticky lg:top-24">
        <svg viewBox={`${-bw / 2 - pad} ${-bh / 2 - pad} ${bw + pad * 2} ${bh + pad * 2}`} className="block h-auto max-h-[62vh] w-full" role="img" aria-label="Превʼю вивіски">
          <defs>
            {ACRYLIC_PALETTE.filter((p) => p.finish === "mirror").map((p) => (
              <linearGradient key={p.id} id={`m-${p.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f8fafc" /><stop offset=".45" stopColor={p.hex} /><stop offset=".6" stopColor="#f8fafc" /><stop offset="1" stopColor={p.hex} />
              </linearGradient>
            ))}
            <filter id="sh" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy={bh * 0.015} stdDeviation={bh * 0.02} floodOpacity=".25" /></filter>
          </defs>
          <polygon points={outline} fill={fill(baseId)} filter="url(#sh)" />
          {frame && shape === "circle" && <circle cx="0" cy="0" r={bw / 2 - inset - fw / 2} fill="none" stroke={fill(textId)} strokeWidth={fw} />}
          {frame && shape !== "circle" && shape !== "arrow" && shape !== "pointer" && (
            <rect x={-bw / 2 + inset} y={-bh / 2 + inset} width={bw - inset * 2} height={bh - inset * 2} rx={shape === "rounded" ? Math.min(bw, bh) * 0.08 : 2} fill="none" stroke={fill(textId)} strokeWidth={fw} />
          )}
          {res && text.trim() && <path d={res.pathData} transform={`translate(${-tw / 2} ${-th / 2}) scale(${s})`} fill={fill(textId)} />}
          {holePts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#f3f1ec" stroke="#94a3b8" strokeWidth={0.8} />)}
        </svg>
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{shape === "circle" ? `Ø${bw}` : `${bw} × ${bh}`} мм · літери {cap} мм · отворів {holes}</span>
          <span>{sheet(baseId).name.uk} {thick} мм + {sheet(textId).name.uk.toLowerCase()}</span>
        </div>
      </section>

      <form className="grid content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <header>
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Конструктор вивісок</p>
          <h1 className="m-0 mt-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,34px)] font-bold leading-tight">Вивіска з акрилу у два шари</h1>
          <p className="mt-1.5 mb-0 text-[var(--muted)]">Усі кольори й матеріали шарів уже в ціні. Ціна змінюється одразу.</p>
          <p className="mt-1.5 mb-0 text-sm"><Link href="/vyvisky/vkazivnyky" className="underline">Невелика табличка-стрілка 25×10 см від 450 ₴ →</Link></p>
        </header>

        <fieldset className="grid gap-2"><legend className="mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">Форма і розмір</legend>
          <div className="flex flex-wrap gap-2">{SHAPES.map(([v, t]) => <Chip key={v} on={shape === v} onClick={() => { setShape(v); const [a, b] = SIZES[v][1] ?? SIZES[v][0]; setW(a); setH(b); }}>{t}</Chip>)}</div>
          <div className="flex flex-wrap gap-2">{SIZES[shape].map(([a, b]) => <Chip key={`${a}x${b}`} on={w === a && (shape === "circle" || shape === "square" || h === b)} onClick={() => { setW(a); setH(b); }}>{shape === "circle" ? `Ø${a / 10}` : `${a / 10}×${b / 10}`} см</Chip>)}</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-sm text-[var(--muted)]">Ширина, мм<input id="s-w" type="number" min={100} max={3000} value={w} onChange={(e) => setW(Math.max(100, Number(e.target.value) || 100))} className="h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-[var(--ink)]" /></label>
            {shape !== "circle" && shape !== "square" && <label className="grid gap-1 text-sm text-[var(--muted)]">Висота, мм<input id="s-h" type="number" min={80} max={2000} value={h} onChange={(e) => setH(Math.max(80, Number(e.target.value) || 80))} className="h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-[var(--ink)]" /></label>}
          </div>
        </fieldset>

        <fieldset className="grid gap-2"><legend className="mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">Основа</legend>
          <div className="flex flex-wrap gap-2.5">{ACRYLIC_PALETTE.map((p) => <Swatch key={p.id} id={p.id} active={baseId === p.id} onPick={() => { setBaseId(p.id); setThick(p.finish === "mirror" ? 3 : 3); }} />)}</div>
          <div className="flex flex-wrap gap-2">{thicknesses.map((t) => <Chip key={t} on={thick === t} onClick={() => setThick(t)}>{t} мм{t > 3 ? " · доплата" : ""}</Chip>)}</div>
        </fieldset>

        <fieldset className="grid gap-2"><legend className="mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">Напис (накладний шар)</legend>
          <input id="s-text" value={text} onChange={(e) => setText(e.target.value.slice(0, 40))} className="h-12 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3.5 text-lg focus:border-[var(--ink)] focus:outline-none" />
          <div className="flex gap-2 overflow-x-auto pb-1">{fonts.map((f) => <Chip key={f.id} on={fontId === f.id} onClick={() => setFontId(f.id)}>{f.name}</Chip>)}</div>
          <div className="flex flex-wrap gap-2.5">{ACRYLIC_PALETTE.map((p) => <Swatch key={p.id} id={p.id} active={textId === p.id} onPick={() => setTextId(p.id)} />)}</div>
          <label className="grid gap-1 text-sm text-[var(--muted)]">Висота великої літери: {cap} мм
            <input id="s-cap" type="range" min={15} max={Math.max(15, maxCap)} value={cap} onChange={(e) => setCap(Number(e.target.value))} className="accent-[var(--ink)]" />
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="s-frame" checked={frame} onChange={(e) => setFrame(e.target.checked)} className="accent-[var(--ink)]" />Рамка тим самим кольором</label>
        </fieldset>

        <fieldset className="grid gap-2"><legend className="mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">Кріплення і опції</legend>
          <div className="flex flex-wrap gap-2">{([0, 2, 4] as const).map((n) => <Chip key={n} on={holes === n} onClick={() => setHoles(n)}>{n ? `${n} отвори Ø6` : "Без отворів"}</Chip>)}</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="s-adh" checked={adhesive} onChange={(e) => setAdhesive(e.target.checked)} className="accent-[var(--ink)]" />Самоклейка на звороті</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="s-tpl" checked={template} onChange={(e) => setTemplate(e.target.checked)} className="accent-[var(--ink)]" />Монтажний трафарет для рівного кріплення</label>
          <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Менше" onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">−</button>
            <input id="s-qty" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} aria-label="Кількість" className="h-10 w-16 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
            <button type="button" aria-label="Більше" onClick={() => setQty(qty + 1)} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">+</button>
          </div>
        </fieldset>

        {checks.length > 0 && (
          <ul className="m-0 grid list-none gap-1 rounded-xl bg-[var(--surface)] p-3 text-sm">
            {checks.map((c, i) => <li key={i} className={c.level === "error" ? "text-[var(--danger)]" : "text-[var(--muted)]"}>{c.message.uk}</li>)}
          </ul>
        )}

        <div className="grid gap-2 rounded-2xl bg-[var(--surface)] p-4">
          <ul className="m-0 grid list-none gap-0.5 p-0 text-[13px] text-[var(--muted)]">
            {price.lines.map((l, i) => <li key={i} className="flex justify-between gap-3"><span>{l.label}</span>{l.amount > 0 && <span className="tabular-nums">+{formatUAH(l.amount)}</span>}</li>)}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[30px] font-extrabold leading-none tabular-nums">{formatUAH(price.total)}
              <small className="mt-1 block text-[13px] font-normal text-[var(--muted)]">{qty > 1 ? `${formatUAH(price.unitPrice)} × ${qty} шт. · ` : ""}{price.needsManager ? "менеджер підтвердить строк" : "виготовлення 3 робочі дні"}</small>
            </div>
            <button type="button" onClick={buy} disabled={errors.length > 0} className="h-[52px] rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] disabled:opacity-40">В кошик</button>
          </div>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--bg)] px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] lg:hidden">
        <b className="text-xl tabular-nums">{formatUAH(price.total)}</b>
        <button type="button" onClick={buy} disabled={errors.length > 0} className="h-12 rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] disabled:opacity-40">В кошик</button>
      </div>
    </div>
  );
}
