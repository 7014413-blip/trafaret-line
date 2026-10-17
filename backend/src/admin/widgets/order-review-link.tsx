// «Посилання на відгук» on the order page: the manager copies it and sends it to the customer
// after the parcel is received (ТЗ §4.10); the review then waits in «Відгуки».

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { orderReviewLink } from "../lib/reviews-api"

const OrderReviewLink = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const [url, setUrl] = useState("")
  const [busy, setBusy] = useState(false)

  const copy = async () => {
    setBusy(true)
    try {
      const link = url || (await orderReviewLink(order.id)).url
      setUrl(link)
      await navigator.clipboard.writeText(link).then(() => toast.success("Посилання скопійовано"), () => toast.info("Скопіюйте посилання нижче"))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="flex flex-col gap-2 px-6 py-4">
      <Heading level="h2">Відгук покупця</Heading>
      <Text size="small" className="text-ui-fg-subtle">Надішліть покупцю після отримання посилки: він поставить зірки, напише відгук і додасть фото.</Text>
      <div><Button size="small" variant="secondary" isLoading={busy} onClick={copy}>Скопіювати посилання на відгук</Button></div>
      {url && <Text size="small" className="break-all">{url}</Text>}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderReviewLink
