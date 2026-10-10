"use client";

// «За вашим макетом» (ТЗ §4.6, §19): the customer uploads a file, sets the size and
// material, sees the price at once and adds it to the cart. A manager checks the
// layout before cutting; raster images are traced and always reviewed.

import { useState } from "react";
import { MATERIALS } from "@/lib/materials";
import { priceStencil } from "@/lib/calculators/pricing";
import { SQUARE_STENCIL_PRESETS } from "@/lib/calculators/square-stencil";
import { formatUAH } from "@/lib/format";
import { useCart } from "@/store/cart-store";
import { uploadLayoutFile } from "@/lib/client/upload-layout-file";
import type { MaterialType } from "@/types/customizer";

const ACCEPT = ".dxf,.ai,.eps,.pdf,.svg,.cdr,.png,.jpg,.jpeg";
const MATS: MaterialType[] = ["pet_thin", "polystyrene", "acrylic"];

async function readAspect(file: File): Promise<number | null> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "svg") {
    const txt = await file.text();
    const vb = /viewBox="([\d.\s-]+)"/.exec(txt)?.[1]?.trim().split(/\s+/).map(Number);
    if (vb && vb.length === 4 && vb[2] > 0 && vb[3] > 0) return vb[3] / vb[2];
    const w = parseFloat(/\swidth="([\d.]+)/.exec(txt)?.[1] ?? ""), h = parseFloat(/\sheight="([\d.]+)/.exec(txt)?.[1] ?? "");
    return w > 0 && h > 0 ? h / w : null;
  }
  if (ext === "png" || ext === "jpg" || ext === "jpeg") {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
      return img.naturalHeight / img.naturalWidth;
    } finally { URL.revokeObjectURL(url); }
  }
  return null;
}

export function UploadOrder() {
  const [file, setFile] = useState<File | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  const [w, setW] = useState(50);
  const [h, setH] = useState(30);
  // Square stencil (Денис 2026-10-10): the layout is fitted into the square, fixed prices for PET.
  const [square, setSquare] = useState(false);
  const [mat, setMat] = useState<MaterialType>("pet_thin");
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<"idle" | "uploading" | "added" | "error">("idle");
  const [msg, setMsg] = useState("");
  const cart = useCart();

  const height = square ? w : aspect ? Math.max(5, Math.round(w * aspect)) : h;
  const m = MATERIALS[mat];
  const unit = priceStencil({ shape: "rect", widthMm: w * 10, heightMm: height * 10 }, m, qty).unitPrice;

  const pick = async (f: File | null) => {
    setFile(f); setState("idle"); setMsg("");
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) { setState("error"); setMsg("Файл більший за 25 МБ. Стисніть його або напишіть нам у Viber."); setFile(null); return; }
    setAspect(await readAspect(f).catch(() => null));
  };

  const add = async () => {
    if (!file) return;
    setState("uploading");
    try {
      const key = await uploadLayoutFile(file);
      cart.add({ key: `upload|${key}|${w}x${height}|${mat}`, title: `${square ? "Квадратний трафарет за вашим макетом" : "За вашим макетом"} «${file.name}», ${w}×${height} см`, materialId: mat, widthCm: w, heightCm: height, quantity: qty, kind: "stencil", uploadKey: key });
      setState("added");
    } catch (e) {
      setState("error"); setMsg((e as Error).message || "Не вдалося завантажити файл. Спробуйте ще раз.");
    }
  };

  const raster = file && /\.(png|jpe?g)$/i.test(file.name);
  return (
    <div className="grid gap-5">
      <label className={`grid cursor-pointer justify-items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center ${file ? "border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
        <input id="u-file" type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        <b className="text-lg">{file ? file.name : "Оберіть файл або перетягніть сюди"}</b>
        <span className="text-sm text-[var(--muted)]">{file ? `${(file.size / 1024 / 1024).toFixed(1)} МБ` : "DXF, AI, EPS, PDF, SVG, CDR, PNG, JPG до 25 МБ"}</span>
      </label>
      {raster && <p className="m-0 rounded-xl bg-[var(--surface)] p-3 text-sm">Картинку переведемо у вектор, менеджер перевірить контури і надішле превʼю до порізки.</p>}

      <div className="grid gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input id="u-square" type="checkbox" checked={square} onChange={(e) => { setSquare(e.target.checked); if (e.target.checked && !SQUARE_STENCIL_PRESETS.some((p) => p.sideMm === w * 10)) setW(30); }} className="h-5 w-5 accent-[var(--ink)]" />
          Квадратний трафарет (макет впишемо в квадрат по центру)
        </label>
        {square && (
          <div className="flex flex-wrap gap-2">
            {SQUARE_STENCIL_PRESETS.map((p) => (
              <button key={p.sideMm} id={`u-square-${p.sideMm / 10}`} type="button" aria-pressed={w * 10 === p.sideMm} onClick={() => setW(p.sideMm / 10)}
                className={`h-10 rounded-full border-[1.5px] px-3.5 text-sm tabular-nums ${w * 10 === p.sideMm ? "border-[var(--ink)] bg-[var(--surface)] font-bold" : "border-[var(--line)] bg-[var(--card)]"}`}>
                {p.sideMm / 10}×{p.sideMm / 10} см · {formatUAH(priceStencil({ shape: "square", widthMm: p.sideMm, heightMm: p.sideMm }, m, 1).unitPrice)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm text-[var(--muted)]">Ширина, см
          <input id="u-w" type="number" min={5} max={400} value={w} onChange={(e) => setW(Math.max(5, Number(e.target.value) || 5))} className="h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-[var(--ink)]" />
        </label>
        <label className="grid gap-1 text-sm text-[var(--muted)]">Висота, см{square ? " (квадрат)" : aspect ? " (за пропорцією файлу)" : ""}
          <input id="u-h" type="number" min={5} max={400} value={height} disabled={!!aspect || square} onChange={(e) => setH(Math.max(5, Number(e.target.value) || 5))} className="h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-[var(--ink)] disabled:opacity-70" />
        </label>
      </div>

      <div className="grid gap-2">
        {MATS.map((id) => (
          <label key={id} className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border-[1.5px] bg-[var(--card)] px-3.5 py-3 ${mat === id ? "border-[var(--ink)]" : "border-[var(--line)]"}`}>
            <input type="radio" name="u-mat" id={`u-mat-${id}`} checked={mat === id} onChange={() => setMat(id)} className="h-[18px] w-[18px] accent-[var(--ink)]" />
            <span><b className="block">{MATERIALS[id].name.uk}</b><span className="text-[13px] text-[var(--muted)]">{MATERIALS[id].note.uk}</span></span>
            <em className="not-italic font-semibold tabular-nums">{formatUAH(priceStencil({ shape: "rect", widthMm: w * 10, heightMm: height * 10 }, MATERIALS[id], 1).unitPrice)}</em>
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-[30px] font-extrabold leading-none tabular-nums">{formatUAH(unit * qty)}
          <small className="mt-1 block text-[13px] font-normal text-[var(--muted)]">{w}×{height} см · {m.name.uk}{qty > 1 ? ` · ${formatUAH(unit)} × ${qty}` : ""}</small>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Менше" onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] bg-[var(--card)] text-lg">−</button>
          <input id="u-qty" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} aria-label="Кількість" className="h-10 w-14 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
          <button type="button" aria-label="Більше" onClick={() => setQty(qty + 1)} className="h-10 w-10 rounded-lg border border-[var(--line)] bg-[var(--card)] text-lg">+</button>
        </div>
      </div>

      {msg && <p role="alert" className="m-0 text-sm text-[var(--danger)]">{msg}</p>}
      <button type="button" onClick={add} disabled={!file || state === "uploading"} className="h-[52px] rounded-full bg-[var(--buy)] font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] disabled:opacity-40">
        {state === "uploading" ? "Завантажуємо файл…" : state === "added" ? "✓ Додано в кошик" : "Додати в кошик"}
      </button>
      <p className="m-0 text-[13px] text-[var(--muted)]">Перевіримо макет і надішлемо превʼю у Viber або Telegram до порізки. Якщо рисунок не виріжеться — повернемо гроші.</p>
    </div>
  );
}
