// Customer fonts an order line uses: every "custom:<key>" id anywhere in its metadata (the
// text of «Свій напис», each canvas element, the lines of letters, plaques and signs).

import { customFontKey } from "../../shared/lib/text/custom-font-id";

export function orderFontKeys(metadata: unknown, found = new Set<string>(), depth = 0): Set<string> {
  if (depth > 8 || metadata == null) return found;
  if (typeof metadata === "string") {
    const key = customFontKey(metadata);
    if (key) found.add(key);
  } else if (Array.isArray(metadata)) {
    for (const item of metadata) orderFontKeys(item, found, depth + 1);
  } else if (typeof metadata === "object") {
    for (const value of Object.values(metadata)) orderFontKeys(value, found, depth + 1);
  }
  return found;
}
