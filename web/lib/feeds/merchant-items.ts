// Feed items of one product: a line per size × material variant with its own price, the
// product page link that opens this variant, and the photos. Google limits the title to 150
// characters, the description to 5000 and extra photos to 10.

import type { CatalogCategory, CatalogProduct } from "../../types/catalog";
import type { FeedAvailability, MerchantItem } from "../../types/feed";
import { htmlToText } from "./html-to-text";

const BRAND = "Trafaret Line";
const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;
const EXTRA_IMAGES_MAX = 10;

function cut(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** «На замовлення» is still sold (made in 3 working days), so only «немає» is out of stock. */
function availabilityOf(product: CatalogProduct): FeedAvailability {
  return product.availability === "out_of_stock" ? "out_of_stock" : "in_stock";
}

/** "Торти і кава > Торти" for the product's first category, its own name for a top section. */
function categoryPath(product: CatalogProduct, categories: CatalogCategory[]): { path: string; root: string } {
  const own = categories.find((c) => c.handle === product.categoryHandles[0]);
  if (!own) return { path: "", root: "" };
  const parent = own.parentHandle ? categories.find((c) => c.handle === own.parentHandle) : undefined;
  return parent ? { path: `${parent.name} > ${own.name}`, root: parent.name } : { path: own.name, root: own.name };
}

export function merchantItems(product: CatalogProduct, categories: CatalogCategory[], base: string): MerchantItem[] {
  const [image, ...extra] = product.images.map((i) => i.url);
  if (!image) return [];
  const description = cut(htmlToText(product.descriptionHtml) || product.seo.description || product.title, DESCRIPTION_MAX);
  const { path, root } = categoryPath(product, categories);
  const availability = availabilityOf(product);
  return product.variants
    .filter((v) => v.price > 0)
    .map((v) => ({
      id: v.sku || v.id,
      groupId: product.handle,
      title: cut(`${product.title}, ${v.sizeLabel}, ${v.materialLabel}`, TITLE_MAX),
      description,
      link: `${base}/p/${product.handle}?variant=${encodeURIComponent(v.id)}`,
      imageLink: image,
      additionalImageLinks: extra.slice(0, EXTRA_IMAGES_MAX),
      availability,
      price: v.price,
      brand: BRAND,
      size: v.sizeLabel,
      material: v.materialLabel,
      productType: path,
      customLabel0: root,
    }));
}
