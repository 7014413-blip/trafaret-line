// Seed for Trafaret Line (Ukraine): UAH store, region Ukraine, two dispatch points
// (Бориспіль, Запоріжжя), Nova Poshta / Ukrposhta shipping options, publishable key,
// catalogue sections and demo products with size × material variants.
// Prices come from the shared calculators (same formula as the storefront).
// Run: npx medusa exec ./src/scripts/seed-trafaret.ts

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow, createProductCategoriesWorkflow, createProductsWorkflow, createRegionsWorkflow,
  createSalesChannelsWorkflow, createShippingOptionsWorkflow, createShippingProfilesWorkflow,
  createStockLocationsWorkflow, createTaxRegionsWorkflow, linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow, updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { MATERIALS } from "../shared/lib/materials";
import { unitPrice } from "../shared/lib/calculators/pricing";
import type { MaterialType } from "../shared/types/customizer";

type Size = { label: string; w: number; h: number };
const sq = (...cm: number[]): Size[] => cm.map((c) => ({ label: `${c}×${c} см`, w: c, h: c }));
const A: Size[] = [{ label: "A5", w: 14.8, h: 21 }, { label: "A4", w: 21, h: 29.7 }, { label: "A3", w: 29.7, h: 42 }, { label: "A2", w: 42, h: 59.4 }];
const round = (cm: number[]): Size[] => cm.map((c) => ({ label: `Ø${c} см`, w: c, h: c }));
const ALL: MaterialType[] = ["pet_thin", "polystyrene", "acrylic"];

const SECTIONS = [
  ["walls", "Для стін і інтерʼєру"], ["plaster", "Декоративна штукатурка"], ["food", "Торти і кава"], ["holidays", "Свята і події"],
  ["custom", "Свій напис і на замовлення"], ["camo", "Піксель, камуфляж, патріотичні"], ["letters", "Літери, цифри, написи"],
  ["business", "Для бізнесу і ОСББ"], ["blanks", "Акрил і ПЕТ заготовки"], ["furniture", "Меблі"], ["outdoor", "Двір і сад"], ["industrial", "Промислове маркування"],
] as const;

const PRODUCTS = [
  { handle: "trafaret-mandala", sku: "TL-WM-0012", title: "Трафарет «Мандала» для стін і меблів", section: "walls", sizes: sq(30, 40, 50, 60, 80, 100), materials: ALL, image: "/demo/products/mandala.jpg",
    description: "Класична мандала для акцентної стіни, дверей, комода чи підлоги." },
  { handle: "mandala-kvitka", sku: "TL-WM-0018", title: "Мандала «Квітка» багатошарова", section: "walls", sizes: sq(40, 60, 80, 100), materials: ALL, image: "/demo/products/mandala2.jpg",
    description: "Обʼємна квітка-мандала для великих стін." },
  { handle: "trafaret-ocheret", sku: "TL-WR-0031", title: "Трафарет «Очерет» для стін і тканини", section: "walls", sizes: A, materials: ALL, image: "/demo/products/kamysh2.jpg",
    description: "Очерет і рогіз для спокійного інтерʼєру, фасадів і текстилю." },
  { handle: "trafaret-trishchyny", sku: "TL-PL-0007", title: "Трафарет «Тріщини» для декоративної штукатурки", section: "plaster", sizes: sq(30, 40, 50, 60, 80, 100), materials: ["polystyrene", "acrylic"] as MaterialType[], image: "/demo/products/treshchiny.jpg",
    description: "Гілясті тріщини для ефекту старої стіни." },
  { handle: "obitsiaiu-tebe-tiramisu", sku: "TL-FD-0001", title: "«Обіцяю тебе» для тірамісу з вашим текстом", section: "food", sizes: round([26, 30, 34]), materials: ["pet_thin", "acrylic"] as MaterialType[], image: "/demo/products/tiramisu.jpg",
    description: "Трафарет для какао на тірамісу з вашими словами і датою." },
  { handle: "just-married", sku: "TL-HL-0040", title: "Just Married для весільного торта", section: "holidays", sizes: round([20, 26, 34]), materials: ["pet_thin"] as MaterialType[], image: "/demo/products/justmarried.jpg",
    description: "Каліграфічний напис для весільного торта і декору." },
  { handle: "yalynka-iz-zavytkiv", sku: "TL-HL-0002", title: "Ялинка із завитків на вікно і пряники", section: "holidays", sizes: A, materials: ["pet_thin", "polystyrene"] as MaterialType[], image: "/demo/products/yolka.jpg",
    description: "Новорічна ялинка для вітрин, вікон і пряників." },
];

export default async function seedTrafaret({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillment = container.resolve(Modules.FULFILLMENT);
  const salesChannels = container.resolve(Modules.SALES_CHANNEL);
  const stores = container.resolve(Modules.STORE);
  const regions = container.resolve(Modules.REGION);

  if ((await regions.listRegions({ name: "Україна" })).length) {
    logger.info("Already seeded (region «Україна» exists). Nothing to do.");
    return;
  }

  const [store] = await stores.listStores();
  let [channel] = await salesChannels.listSalesChannels({ name: "Trafaret Line" });
  if (!channel) {
    const { result } = await createSalesChannelsWorkflow(container).run({ input: { salesChannelsData: [{ name: "Trafaret Line", description: "trafaret-line.com.ua" }] } });
    channel = result[0];
  }
  await updateStoresWorkflow(container).run({ input: { selector: { id: store.id }, update: {
    name: "Trafaret Line", supported_currencies: [{ currency_code: "uah", is_default: true }], default_sales_channel_id: channel.id,
  } } });

  logger.info("Region Ukraine (UAH)...");
  const { result: [region] } = await createRegionsWorkflow(container).run({ input: { regions: [{
    name: "Україна", currency_code: "uah", countries: ["ua"], payment_providers: ["pp_system_default"], automatic_taxes: false,
  }] } });
  await createTaxRegionsWorkflow(container).run({ input: [{ country_code: "ua", provider_id: "tp_system" }] }); // ФОП 2 група, без ПДВ

  logger.info("Dispatch points...");
  const { result: locations } = await createStockLocationsWorkflow(container).run({ input: { locations: [
    { name: "Бориспіль", address: { city: "Бориспіль", country_code: "UA", address_1: "" } },
    { name: "Запоріжжя", address: { city: "Запоріжжя", country_code: "UA", address_1: "" } },
  ] } });
  await updateStoresWorkflow(container).run({ input: { selector: { id: store.id }, update: { default_location_id: locations[0].id } } });

  const [profileFound] = await fulfillment.listShippingProfiles({ type: "default" });
  const profile = profileFound ?? (await createShippingProfilesWorkflow(container).run({ input: { data: [{ name: "Default", type: "default" }] } })).result[0];

  for (const loc of locations) {
    await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: loc.id }, [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" } });
    const set = await fulfillment.createFulfillmentSets({ name: `Відправка ${loc.name}`, type: "shipping",
      service_zones: [{ name: `Україна (${loc.name})`, geo_zones: [{ country_code: "ua", type: "country" }] }] });
    await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: loc.id }, [Modules.FULFILLMENT]: { fulfillment_set_id: set.id } });
    // Carrier tariff is paid on delivery: price 0 on the site, "за тарифом перевізника".
    const opt = (code: string, label: string, description: string) => ({
      name: `${label} (${loc.name})`, price_type: "flat" as const, provider_id: "manual_manual", service_zone_id: set.service_zones[0].id,
      shipping_profile_id: profile.id, type: { label, description, code: `${code}-${loc.name === "Бориспіль" ? "bor" : "zap"}` },
      prices: [{ currency_code: "uah", amount: 0 }, { region_id: region.id, amount: 0 }],
      rules: [{ attribute: "enabled_in_store", value: "true", operator: "eq" as const }, { attribute: "is_return", value: "false", operator: "eq" as const }],
    });
    await createShippingOptionsWorkflow(container).run({ input: [
      opt("np-branch", "Нова пошта: відділення або поштомат", "За тарифом Нової пошти"),
      opt("np-courier", "Нова пошта: курʼєр", "За тарифом Нової пошти"),
      opt("ukrposhta", "Укрпошта", "За тарифом Укрпошти"),
    ] });
    await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: loc.id, add: [channel.id] } });
  }

  logger.info("Publishable key...");
  const { data: keys } = await query.graph({ entity: "api_key", fields: ["id", "token"], filters: { type: "publishable" } });
  const key = keys[0] ?? (await createApiKeysWorkflow(container).run({ input: { api_keys: [{ title: "Storefront", type: "publishable", created_by: "" }] } })).result[0];
  await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channel.id] } });

  logger.info("Categories and products...");
  const { result: cats } = await createProductCategoriesWorkflow(container).run({ input: { product_categories: SECTIONS.map(([handle, name]) => ({ name, handle, is_active: true })) } });
  const catId = (h: string) => cats.find((c) => c.handle === h)!.id;

  await createProductsWorkflow(container).run({ input: { products: PRODUCTS.map((p) => ({
    title: p.title, handle: p.handle, description: p.description, status: ProductStatus.PUBLISHED,
    category_ids: [catId(p.section)], shipping_profile_id: profile.id, images: [{ url: p.image }], thumbnail: p.image,
    metadata: { sku: p.sku, type: "ready" },
    options: [{ title: "Розмір", values: p.sizes.map((s) => s.label) }, { title: "Матеріал", values: p.materials.map((m) => MATERIALS[m].name.uk) }],
    variants: p.sizes.flatMap((s) => p.materials.map((m) => ({
      title: `${s.label} / ${MATERIALS[m].name.uk}`,
      sku: `${p.sku}-${s.label.replace(/[^\dA-Za-z]/g, "")}-${m}`,
      manage_inventory: false, // made to order
      options: { "Розмір": s.label, "Матеріал": MATERIALS[m].name.uk },
      metadata: { widthCm: s.w, heightCm: s.h, materialId: m },
      prices: [{ amount: unitPrice(s.w, s.h, MATERIALS[m]) ?? 0, currency_code: "uah" }],
    }))),
    sales_channels: [{ id: channel.id }],
  })) } });

  logger.info(`Done. Publishable key: ${key.token ?? key.id}`);
}
