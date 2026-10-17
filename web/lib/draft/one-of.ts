// A draft field that must be one of a fixed list (mode, shape, holes); anything else fails the
// draft through the reader, so the whole draft is ignored.

import type { DesignReader } from "../../types/design-reader";

export function oneOf<T>(read: DesignReader, value: unknown, allowed: readonly T[], what: string): T {
  if (!allowed.includes(value as T)) read.fail(`bad ${what}`);
  return value as T;
}
