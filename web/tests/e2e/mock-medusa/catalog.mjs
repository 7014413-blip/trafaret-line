// Catalogue the mock Medusa serves to the storefront in end-to-end tests: one section
// «Торти і кава» with one ready stencil in two sizes and two materials. Prices are Medusa
// variant prices in UAH, as the seed creates them. Russian texts sit in metadata, as the
// catalogue import writes them.

export const REGION = { id: "reg_ua", name: "Україна", currency_code: "uah" };

export const CATEGORIES = [
  { id: "pcat_food", name: "Торти і кава", handle: "food", description: "Трафарети для тортів і кави", rank: 0, parent_category_id: null, metadata: { path: "/food", i18n: { ru: { name: "Торты и кофе" } } } },
  { id: "pcat_food_tort", name: "Торти", handle: "food-tort", description: "Трафарети для тортів", rank: 0, parent_category_id: "pcat_food", metadata: { path: "/food/tort", i18n: { ru: { name: "Торты" } } } },
];

const SIZES = ["15 × 15 см", "20 × 20 см"];
const MATERIALS = [
  { label: "PET 0,5 мм", ru: "PET 0,5 мм", code: "pet-05" },
  { label: "Полістирол 1 мм", ru: "Полистирол 1 мм", code: "ps-1-white" },
];
const PRICES = { "15 × 15 см|pet-05": 150, "15 × 15 см|ps-1-white": 160, "20 × 20 см|pet-05": 180, "20 × 20 см|ps-1-white": 190 };
const SHEETS = { "15 × 15 см": [150, 150], "20 × 20 см": [200, 200] };

function variants() {
  return SIZES.flatMap((size, s) => MATERIALS.map((material, m) => ({
    id: `variant_${s}_${m}`,
    title: `${size} · ${material.label}`,
    sku: `TL-ROSE-${s}${m}`,
    calculated_price: { calculated_amount: PRICES[`${size}|${material.code}`], original_amount: PRICES[`${size}|${material.code}`], currency_code: "uah" },
    options: [
      { value: size, option: { title: "Розмір" } },
      { value: material.label, option: { title: "Матеріал" } },
    ],
    metadata: { size_code: size.replace(/ × /, "x").replace(" см", ""), material_code: material.code, sheet_mm: SHEETS[size], title_ru: `${size} · ${material.ru}` },
  })));
}

export function products(origin) {
  return [{
    id: "prod_rose",
    title: "Трафарет для торта «Троянди»",
    subtitle: "Візерунок з троянд для крему, какао й айсингу",
    handle: "trafaret-troiandy",
    description: "<p>Гнучкий трафарет для прикраси торта.</p>",
    thumbnail: `${origin}/static/rose.jpg`,
    images: [{ id: "img_rose", url: `${origin}/static/rose.jpg` }],
    categories: [{ id: "pcat_food_tort", handle: "food-tort", name: "Торти" }],
    options: [
      { id: "opt_size", title: "Розмір", values: SIZES.map((value) => ({ value })) },
      { id: "opt_material", title: "Матеріал", values: MATERIALS.map((m) => ({ value: m.label })) },
    ],
    variants: variants(),
    metadata: {
      catalog_type: "ready", hit: true, is_new: true, primary_category: "food-tort",
      i18n: {
        ru: {
          title: "Трафарет для торта «Розы»",
          subtitle: "Узор из роз для крема, какао и айсинга",
          description: "<p>Гибкий трафарет для украшения торта.</p>",
          options: { "Матеріал": Object.fromEntries(MATERIALS.map((m) => [m.label, m.ru])) },
        },
      },
    },
    updated_at: "2026-10-15T00:00:00.000Z",
  }];
}
