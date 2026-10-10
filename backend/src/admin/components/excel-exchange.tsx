// «Вивантажити в Excel» / «Завантажити з Excel» for the product list (Prom.ua style).
// Upload works in two steps: «Перевірити» shows what will change, «Застосувати» saves.

import { Button, Heading, Text, toast } from "@medusajs/ui"
import { useRef, useState } from "react"
import type { KabinetImportReport } from "../../types/kabinet"
import { downloadExport, importCsv } from "../lib/kabinet-api"

export const ExcelExchange = ({ onImported }: { onImported: () => void }) => {
  const input = useRef<HTMLInputElement>(null)
  const [csv, setCsv] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [report, setReport] = useState<KabinetImportReport | null>(null)
  const [busy, setBusy] = useState<"export" | "check" | "apply" | null>(null)

  const exportAll = async () => {
    setBusy("export")
    try {
      await downloadExport()
      toast.success("Файл вивантажено. Відкрийте його в Excel, змініть і збережіть як «CSV UTF-8».")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const pick = async (file: File | undefined) => {
    if (!file) return
    if (!/\.(csv|txt)$/i.test(file.name)) { toast.error("Збережіть таблицю в Excel як «CSV UTF-8 (розділювач — кома)» і завантажте цей файл"); return }
    const text = await file.text()
    setCsv(text)
    setFileName(file.name)
    setBusy("check")
    try {
      setReport(await importCsv(text, true))
    } catch (e) {
      toast.error((e as Error).message)
      setReport(null)
    } finally {
      setBusy(null)
    }
  }

  const apply = async () => {
    if (!csv) return
    setBusy("apply")
    try {
      const done = await importCsv(csv, false)
      setReport(done)
      toast.success(`Готово: оновлено ${done.productsUpdated}, створено ${done.productsCreated}`)
      setCsv(null)
      onImported()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const changes = report ? report.productsUpdated + report.productsCreated : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" isLoading={busy === "export"} onClick={exportAll}>Вивантажити в Excel</Button>
        <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = "" }} />
        <Button variant="secondary" isLoading={busy === "check"} onClick={() => input.current?.click()}>Завантажити з Excel</Button>
      </div>

      {report && (
        <div className="bg-ui-bg-subtle flex flex-col gap-2 rounded-lg p-4" role="status">
          <Heading level="h3">{report.dryRun ? `Перевірка файлу ${fileName}` : "Зміни збережено"}</Heading>
          <Text size="small">
            Рядків: {report.rows}. Товарів змінено: {report.productsUpdated}, нових: {report.productsCreated}.
            Цін змінено: {report.pricesChanged}, нових варіантів: {report.variantsAdded}, знято з продажу: {report.variantsRemoved}.
          </Text>
          {report.preview.length > 0 && (
            <ul className="text-ui-fg-subtle list-disc pl-5 text-sm">
              {report.preview.map((line) => <li key={line}>{line}</li>)}
            </ul>
          )}
          {report.issues.length > 0 && (
            <div>
              <Text size="small" weight="plus" className="text-ui-fg-error">Зауваження ({report.issues.length}):</Text>
              <ul className="text-ui-fg-error list-disc pl-5 text-sm">
                {report.issues.slice(0, 50).map((issue, i) => <li key={i}>Рядок {issue.row}: {issue.message}</li>)}
              </ul>
            </div>
          )}
          {report.dryRun && (
            <div className="flex gap-2">
              <Button onClick={apply} isLoading={busy === "apply"} disabled={!changes}>Застосувати зміни ({changes})</Button>
              <Button variant="secondary" onClick={() => { setReport(null); setCsv(null) }}>Скасувати</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
