"use client";

// Assembly example: all components on one page with sample data, for the dev thread
// to drop into app/(shop)/demo and check in the browser. Not a production page.

import { useMemo, useState } from "react";
import { BentoCard, BentoGrid } from "../../components/ui/BentoGrid";
import { BeforeAfterSlider } from "../../components/customizer/BeforeAfterSlider";
import { MaterialViewer } from "../../components/customizer/MaterialViewer";
import { SpotlightSearch } from "../../components/navigation/SpotlightSearch";
import { CartDrawer } from "../../components/cart/CartDrawer";
import { localSearch } from "../../lib/search";
import { MATERIALS, calculateStencilPrice, formatUAH } from "../../lib/stencil-math";
import type { CartLine, MaterialType, ProductHit, SectionTheme, StencilVectorMetrics } from "../../types/customizer";

const HITS: ProductHit[] = [
  { id: "love", handle: "z-lyubovyu", title: "Трафарет «З любовʼю» для торта", sku: "TL-S-0012", section: "sweet", categoryTitle: "Торти", priceFrom: 150, thumbnail: "/demo/love.jpg" },
  { id: "coffee", handle: "kava-sertse", title: "Трафарет на каву «Серце»", sku: "TL-S-0040", section: "sweet", categoryTitle: "Кава", priceFrom: 150, thumbnail: "/demo/coffee.jpg" },
  { id: "cargo", handle: "verh-krykhke", title: "Маркування вантажу «Верх», «Крихке»", sku: "TL-M-0177", standards: ["ГОСТ 14192-96"], section: "industrial", categoryTitle: "Маркування", priceFrom: 150, thumbnail: "/demo/cargo.jpg" },
];

export default function DemoPage() {
  const [section, setSection] = useState<SectionTheme>("sweet");
  const [material, setMaterial] = useState<MaterialType>("pet_thin");
  const [cartOpen, setCartOpen] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);

  // A4 sheet, cut length from the constructor (sample value).
  const metrics: StencilVectorMetrics = { widthMm: 210, heightMm: 297, pathLengthMeters: 2.53, areaSquareMeters: 0.0624, bridgeCount: 3, isClosedLoopValid: true, pieces: 1 };
  const price = useMemo(() => calculateStencilPrice(metrics, MATERIALS[material], 1), [material]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = () => {
    if (price.priceOnRequest) return;
    // Optimistic: show in the cart at once, then sync with Medusa.
    setLines((l) => [...l, { id: crypto.randomUUID(), title: "Трафарет «З любовʼю»", materialId: material, widthCm: 21, heightCm: 29.7, quantity: 1, unitPrice: price.unitPrice, section }]);
    setCartOpen(true);
  };

  return (
    <main data-role={section} className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--ink)] md:px-8">
      <header className="mb-6 flex items-center gap-4">
        <strong className="font-[family-name:var(--font-display)] text-lg">TRAFARET·LINE</strong>
        <SpotlightSearch search={async (q) => ({ products: localSearch(HITS, q), categories: [] })} popular={HITS} />
      </header>

      <nav className="mb-6 flex gap-2">
        {(["sweet", "interior", "industrial"] as const).map((r) => (
          <button key={r} type="button" aria-pressed={section === r} onClick={() => setSection(r)}
            className={`h-10 rounded-full border-[1.5px] px-4 ${section === r ? "border-[var(--inv-bg)] bg-[var(--inv-bg)] text-[var(--inv-fg)]" : "border-[var(--line)]"}`}>
            {{ sweet: "Солодке і декор", interior: "Інтерʼєр і творчість", industrial: "Індустрія і B2B" }[r]}
          </button>
        ))}
      </nav>

      <section className="grid gap-6 lg:grid-cols-2">
        <BeforeAfterSlider stencilImage="/demo/cake-stencil.jpg" resultImage="/demo/cake-result.jpg" aspectRatio="aspect-[4/3]" priority />
        <div className="space-y-4">
          <MaterialViewer value={material} onChange={setMaterial} />
          <p className="text-3xl font-bold tabular-nums">{price.priceOnRequest ? "Ціна за запитом" : formatUAH(price.unitPrice)}</p>
          <button type="button" onClick={add} className="h-[52px] rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)]">У кошик</button>
        </div>
      </section>

      <section className="mt-10">
        <BentoGrid>
          <BentoCard className="md:col-span-2 md:row-span-2" category="Виробництво" title="Ріжемо лазером за 3 робочі дні"
            bgMedia={{ type: "video", src: "/demo/laser.mp4", poster: "/demo/laser.jpg" }} href="/about" />
          <BentoCard category="Торти" title="Напис какао за 2 хвилини" bgMedia={{ type: "image", src: "/demo/cake-result.jpg" }} href="/food" />
          <BentoCard category="Свій трафарет" title="Будь-який текст і шрифт" description="Превʼю і ціна одразу" href="/constructor" />
          <BentoCard tone="dark" category="B2B" title="Маркування для енергетики і складів" href="/business" />
        </BentoGrid>
      </section>

      <CartDrawer
        lines={lines}
        open={cartOpen}
        onOpenChange={setCartOpen}
        onQuantity={(id, q) => setLines((l) => l.map((x) => (x.id === id ? { ...x, quantity: q } : x)))}
        onRemove={(id) => setLines((l) => l.filter((x) => x.id !== id))}
        upsells={[{ id: "spatula", title: "Кондитерський шпатель", reason: "Рівно розподіляє крем по трафарету", price: 120 }]}
        onAddUpsell={() => undefined}
        onCheckout={() => undefined}
        onInvoice={() => undefined}
      />
    </main>
  );
}
