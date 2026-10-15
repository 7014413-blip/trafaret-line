// Measures the parts of a wedding initials design in its font (lib/joined-words/measure-piece.ts):
// the first letters, the second letters and a separator character when it is drawn with the font.

import type { InitialsDesign } from "../../types/initials";
import type { LoadedFont } from "../../types/text";
import { measureJoinedPiece, type MeasuredJoinedPiece } from "../joined-words/measure-piece";
import { separatorText } from "./separator-text";

export interface MeasuredInitials {
  first: MeasuredJoinedPiece | null;
  second: MeasuredJoinedPiece | null;
  sep: MeasuredJoinedPiece | null;
}

export function measureInitials(design: Pick<InitialsDesign, "first" | "second" | "separator">, font: LoadedFont): MeasuredInitials {
  const sep = separatorText(design.separator);
  return {
    first: measureJoinedPiece(font, design.first, false),
    second: measureJoinedPiece(font, design.second, false),
    sep: sep ? measureJoinedPiece(font, sep, false) : null,
  };
}
