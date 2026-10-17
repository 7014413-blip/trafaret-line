// Plain text of a catalogue HTML description for feeds: tags dropped, the common entities
// decoded, whitespace collapsed. Feeds escape the result again when they write XML.

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&#39;": "'", "&laquo;": "«", "&raquo;": "»", "&mdash;": "—", "&ndash;": "–" };

export function htmlToText(html: string): string {
  return html
    .replace(/<(br|\/p|\/li|\/h[1-6])\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(nbsp|amp|lt|gt|quot|#39|laquo|raquo|mdash|ndash);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}
