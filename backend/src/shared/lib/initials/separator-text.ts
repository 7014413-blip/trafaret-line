// Characters of the separators drawn with the font (the bar and the dot are drawn as shapes).

import type { InitialsSeparator } from "../../types/initials";

export function separatorText(separator: InitialsSeparator): string {
  return separator === "amp" ? "&" : separator === "plus" ? "+" : "";
}
