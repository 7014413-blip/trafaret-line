// «Файли для виробництва» on the order page (ТЗ §7, §23): machine files SVG and DXF with the
// order number in the name, PNG previews, parameters and the customer's fonts; buttons
// «Усі файли (ZIP)», «Завантажити шрифти замовлення» and «Перебудувати файли».

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import type { OrderFile } from "../../types/order-files"
import { loadOrderFiles, orderArchiveUrl, orderFileUrl, rebuildOrderFiles } from "../lib/order-files-api"

const KIND_LABEL: Record<OrderFile["kind"], string> = { svg: "SVG", dxf: "DXF", png: "PNG", json: "Параметри", font: "Шрифт" }

const size = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`)

const OrderProductionFiles = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const [files, setFiles] = useState<OrderFile[]>([])
  const [problems, setProblems] = useState<string[]>([])
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    let live = true
    loadOrderFiles(order.id)
      .then((r) => { if (live) { setFiles(r.files); setProblems(r.problems) } })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => { if (live) setBusy(false) })
    return () => { live = false }
  }, [order.id])

  const rebuild = async () => {
    setBusy(true)
    try {
      const r = await rebuildOrderFiles(order.id)
      setFiles(r.files)
      setProblems(r.problems)
      toast.success("Файли замовлення зібрано заново")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const hasFonts = files.some((f) => f.kind === "font")
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Файли для виробництва</Heading>
        <Button size="small" variant="secondary" isLoading={busy} onClick={rebuild}>Перебудувати файли</Button>
      </div>
      <div className="flex flex-col gap-2 px-6 py-4">
        {!files.length && !busy && <Text size="small" className="text-ui-fg-subtle">Файлів ще немає. Натисніть «Перебудувати файли».</Text>}
        {files.map((file) => (
          <a key={file.name} href={orderFileUrl(order.id, file.name)} className="flex justify-between gap-3 text-ui-fg-interactive hover:underline">
            <Text size="small" className="truncate">{file.name}</Text>
            <Text size="small" className="shrink-0 text-ui-fg-subtle">{KIND_LABEL[file.kind]} · {size(file.sizeBytes)}</Text>
          </a>
        ))}
      </div>
      {problems.length > 0 && (
        <div className="flex flex-col gap-1 px-6 py-4">
          {problems.map((p) => <Text key={p} size="small" className="text-ui-fg-error">{p}</Text>)}
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 py-4">
          <Button size="small" variant="secondary" asChild><a href={orderArchiveUrl(order.id, false)}>Усі файли (ZIP)</a></Button>
          {hasFonts && <Button size="small" variant="secondary" asChild><a href={orderArchiveUrl(order.id, true)}>Завантажити шрифти замовлення</a></Button>}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderProductionFiles
