"use client";

// «Заготовки» configurator (ТЗ §4.7): shape → size (popular chips or own) → material and
// thickness → colour → quantity on one screen, a scheme with the size, the price of one piece,
// of a pack and of the order, and the wholesale scale before ordering. The price is the blank
// formula shared with the catalogue cards (lib/blanks/price.ts) and is recomputed on the server.

import { useState } from "react";
import { BlankScheme } from "@/components/blanks/BlankScheme";
import { BlankShapePicker } from "@/components/blanks/BlankShapePicker";
import { BlankSheetPicker } from "@/components/blanks/BlankSheetPicker";
import { BlankSizePicker } from "@/components/blanks/BlankSizePicker";
import { BlankTierTable } from "@/components/blanks/BlankTierTable";
import { BuyPanel } from "@/components/signage/BuyPanel";
import { ConstructorHeader } from "@/components/signage/ConstructorHeader";
import { QuantityField } from "@/components/signage/QuantityField";
import { priceBlankDesign } from "@/lib/blanks/price";
import { blankShape } from "@/lib/blanks/shapes";
import { BLANK_COLOURS, blankSheetAt } from "@/lib/blanks/sheets";
import { blankSheetMm, presetMm } from "@/lib/blanks/size";
import { sizeForShape } from "@/lib/blanks/size-for-shape";
import { blankSizeText, blankTitle } from "@/lib/blanks/title";
import { useBuyState } from "@/lib/client/use-buy-state";
import { useDispatchLabel } from "@/lib/client/use-dispatch-label";
import { blankThumbnailSvg } from "@/lib/export/blank-thumbnail";
import { formatUAH } from "@/lib/format";
import { useCart } from "@/store/cart-store";
import type { BlankDesign, BlankShapeId, BlankSheetOption, BlankSizeValue } from "@/types/blank";

const FIRST_SHAPE: BlankShapeId = "circle";
const FIRST_SIZE: BlankSizeValue = { preset: 3, ...presetMm(10) };

export function BlanksConfigurator() {
  const [shapeId, setShapeId] = useState<BlankShapeId>(FIRST_SHAPE);
  const [size, setSize] = useState<BlankSizeValue>(FIRST_SIZE);
  const [sheet, setSheet] = useState<BlankSheetOption>(() => blankSheetAt("clear", 3, "clear"));
  const [qty, setQty] = useState(1);
  const buyState = useBuyState();
  const dispatch = useDispatchLabel();
  const cart = useCart();

  const shape = blankShape(shapeId);
  const cut = blankSheetMm(shape, size.widthMm, size.heightMm);
  const design: BlankDesign = { shapeId, ...cut, materialId: sheet.materialId, colourId: sheet.colourId, quantity: qty };
  const price = priceBlankDesign(design);
  const colour = BLANK_COLOURS[sheet.colourId];
  const unitOf = (widthMm: number, heightMm: number) => priceBlankDesign({ ...design, widthMm, heightMm, quantity: 1 }).unitPrice;

  const chooseShape = (id: BlankShapeId) => {
    setShapeId(id);
    setSize((current) => sizeForShape(id, current));
  };

  const buy = () => {
    cart.add({
      // Same blank = same cart line (quantities add up), whatever the quantity chosen here.
      key: `blank|${JSON.stringify({ ...design, quantity: 0 })}`,
      title: blankTitle(design),
      materialId: design.materialId,
      widthCm: design.widthMm / 10,
      heightCm: design.heightMm / 10,
      quantity: qty,
      kind: "blank",
      blank: design,
      basePrice: price.tiers[0].unitPrice,
      vectorSvg: blankThumbnailSvg(shape, design.widthMm, design.heightMm, colour),
    });
    buyState.added();
  };

  const lines = [
    { label: `Ціна за шт.: ${formatUAH(price.unitPrice)}${price.discount ? ` (−${Math.round(price.discount * 100)}%)` : ""}` },
    { label: `Упаковка ${price.packQty} шт.: ${formatUAH(price.packPrice)}` },
  ];

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label="Схема заготовки" className="self-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] lg:sticky lg:top-24">
        <div className="p-4">
          <BlankScheme shape={shape} widthMm={cut.widthMm} heightMm={cut.heightMm} colour={colour}
            label={`Схема заготовки «${shape.name.uk}» ${blankSizeText(design)}`} />
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{shape.name.uk} · {blankSizeText(design)}</span>
          <span>{blankTitle(design).split(", ").slice(1).join(", ")}</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <ConstructorHeader kicker="Заготовки" title="Заготовки з акрилу, дзеркального пластику і PET"
          lead="Оберіть форму, розмір, матеріал і колір. Ріжемо лазером за 3 робочі дні, ціна за штуку одразу, опт від 10 шт." />

        <BlankShapePicker value={shapeId} onChange={chooseShape} />
        <BlankSizePicker shape={shape} value={size} onChange={setSize} priceOf={unitOf} />
        <BlankSheetPicker value={sheet} onChange={setSheet} />
        <QuantityField idPrefix="bl" value={qty} onChange={setQty} />

        <BuyPanel lines={lines} total={price.total} unitPrice={price.unitPrice} qty={qty} note={dispatch}
          state={buyState.state} canBuy onBuy={buy}>
          <BlankTierTable tiers={price.tiers} quantity={qty} />
        </BuyPanel>
      </form>
    </div>
  );
}
