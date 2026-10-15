// Looks up a «Написи на планці» sheet by id; unknown ids are refused (the server reads designs from the browser).

import type { JoinedWordsMaterial } from "../../types/joined-words";
import { JOINED_WORDS_MATERIALS } from "./materials";

export function findJoinedWordsMaterial(id: string, palette: JoinedWordsMaterial[] = JOINED_WORDS_MATERIALS): JoinedWordsMaterial {
  const sheet = palette.find((m) => m.id === id);
  if (!sheet) throw new Error(`Unknown joined words material: ${id}`);
  return sheet;
}
