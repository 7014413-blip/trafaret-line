// Customer text of a review: control characters dropped, spaces collapsed, trimmed.

/** Drops control characters (line breaks stay in the text) and repeated spaces. */
export function cleanReviewText(value: unknown, keepLines: boolean): string {
  const text = typeof value === "string" ? value : "";
  const noControls = text.replace(keepLines ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, " ");
  const lines = noControls.split("\n").map((line) => line.replace(/\s+/g, " ").trim());
  return (keepLines ? lines.join("\n").replace(/\n{3,}/g, "\n\n") : lines.join(" ")).trim();
}
