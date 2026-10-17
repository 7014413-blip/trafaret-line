// Picture of an order line for the cabinet: the product photo of a catalogue line, otherwise
// the constructor's preview as an SVG data URL. The SVG is only ever shown as an image (<img>),
// where it cannot run scripts, never put into the page as markup.

import type { AccountOrderItemRecord } from "../../types/account";
import { previewSvgOf } from "../../shared/lib/validation/preview-svg";

export function previewImageUrl(item: AccountOrderItemRecord): string | null {
  if (item.thumbnail && /^https?:\/\//.test(item.thumbnail)) return item.thumbnail;
  const svg = previewSvgOf(item.metadata?.previewSvg);
  return svg ? `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}` : null;
}
