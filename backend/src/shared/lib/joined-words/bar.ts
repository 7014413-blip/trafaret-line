// The strip under the letters of one piece: its height follows the letter height inside the
// limits, it reaches up into the letters so they fuse with it and sticks out a little at both ends.

import type { JoinedWordsConfig } from "../../types/joined-words";
import { DEFAULT_JOINED_WORDS_CONFIG } from "./config";

export interface JoinedBar {
  heightMm: number;
  overlapMm: number;
  extendMm: number;
}

export function joinedBar(capMm: number, cfg: JoinedWordsConfig = DEFAULT_JOINED_WORDS_CONFIG): JoinedBar {
  const heightMm = Math.min(cfg.barMaxMm, Math.max(cfg.barMinMm, capMm * cfg.barShare));
  return { heightMm, overlapMm: heightMm * cfg.barOverlapShare, extendMm: heightMm * cfg.barExtendShare };
}
