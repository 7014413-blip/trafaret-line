// RSS 2.0 text of the product feed with the Google namespace (g:). Google Merchant Center and
// Meta Commerce Manager read the same file. Every value is XML-escaped; products are handmade
// to order without barcodes, so identifier_exists is "no".

import type { MerchantFeed, MerchantItem } from "../../types/feed";

/** Control characters other than tab and line breaks are not allowed in XML 1.0. */
function allowedInXml(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x20 || code === 0x09 || code === 0x0a || code === 0x0d;
}

function xml(text: string): string {
  return Array.from(text).filter(allowedInXml).join("")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function tag(name: string, value: string): string {
  return value ? `<${name}>${xml(value)}</${name}>` : "";
}

function itemXml(item: MerchantItem): string {
  return [
    "<item>",
    tag("g:id", item.id),
    tag("g:item_group_id", item.groupId),
    tag("g:title", item.title),
    tag("g:description", item.description),
    tag("g:link", item.link),
    tag("g:image_link", item.imageLink),
    ...item.additionalImageLinks.map((url) => tag("g:additional_image_link", url)),
    tag("g:availability", item.availability),
    tag("g:price", `${item.price.toFixed(2)} UAH`),
    tag("g:brand", item.brand),
    tag("g:condition", "new"),
    tag("g:identifier_exists", "no"),
    tag("g:size", item.size),
    tag("g:material", item.material),
    tag("g:product_type", item.productType),
    tag("g:custom_label_0", item.customLabel0),
    "</item>",
  ].join("");
}

export function merchantFeedXml(feed: MerchantFeed): string {
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<rss version=\"2.0\" xmlns:g=\"http://base.google.com/ns/1.0\">",
    "<channel>",
    tag("title", feed.title),
    tag("link", feed.link),
    tag("description", feed.description),
    ...feed.items.map(itemXml),
    "</channel>",
    "</rss>",
  ].join("\n");
}
