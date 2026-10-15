// Text of a line as it is cut: spaces collapsed, capitals when asked.

export function stickLineText(text: string, upper: boolean): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return upper ? clean.toUpperCase() : clean;
}
