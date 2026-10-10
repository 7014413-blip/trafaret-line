// CSV for Excel (Ukrainian Windows): UTF-8 with BOM and «;» as the separator, so the file
// opens in Excel with Cyrillic intact and saves back the same way («CSV UTF-8»). The
// parser also reads «,» and tab files and quoted cells with line breaks.

export const CSV_SEPARATOR = ";"
const BOM = "﻿"

function quote(value: string): string {
  return /[;"\r\n,\t]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function toCsv(header: string[], rows: string[][]): string {
  const lines = [header, ...rows].map((row) => row.map((cell) => quote(cell ?? "")).join(CSV_SEPARATOR))
  return BOM + lines.join("\r\n") + "\r\n"
}

/** Separator of the first line: «;», «,» or tab, whichever appears most outside quotes. */
function detectSeparator(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ""
  const counts = [";", ",", "\t"].map((sep) => ({ sep, n: firstLine.split(sep).length - 1 }))
  return counts.sort((a, b) => b.n - a.n)[0].n > 0 ? counts[0].sep : CSV_SEPARATOR
}

/** Rows of cells; the header is the first row. Empty trailing lines are dropped. */
export function parseCsv(input: string): string[][] {
  const text = input.startsWith(BOM) ? input.slice(1) : input
  const sep = detectSeparator(text)
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
      continue
    }
    if (ch === '"' && cell === "") { quoted = true; continue }
    if (ch === sep) { row.push(cell); cell = ""; continue }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
      continue
    }
    cell += ch
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}
