// Text of a <script type="application/ld+json"> block. Customer texts (reviews) go into it, so
// "<", ">" and "&" are written as \u escapes: a review containing "</script>" cannot end the
// block and run as HTML.

export function jsonLdText(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
