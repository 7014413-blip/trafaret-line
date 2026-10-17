// Product feed for Google Merchant Center and the Meta catalogue (both read the same RSS 2.0
// file with g: fields): one item per size × material variant, grouped by the product handle.

export type FeedAvailability = "in_stock" | "out_of_stock";

export interface MerchantItem {
  /** Variant SKU (the article buyers see), or the variant id when the SKU is empty. */
  id: string;
  /** Product handle: every variant of one product shares it. */
  groupId: string;
  title: string;
  description: string;
  /** Product page with this variant chosen (?variant=). */
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  availability: FeedAvailability;
  /** Price of one piece, UAH. */
  price: number;
  brand: string;
  size: string;
  material: string;
  /** Catalogue path, "Торти і кава > Торти". */
  productType: string;
  /** Top catalogue section, for campaign splits in Google Ads. */
  customLabel0: string;
}

export interface MerchantFeed {
  title: string;
  link: string;
  description: string;
  items: MerchantItem[];
}
