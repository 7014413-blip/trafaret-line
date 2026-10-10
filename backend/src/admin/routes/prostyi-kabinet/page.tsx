// «Простий кабінет» → «Товари»: a Prom.ua-like product list (Денис 10.10).
// Photo, name, price «від», category, status and availability; search, category and
// status filters; 50 per page. A row opens the one-page product form.

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Select, Table, Text } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import type { KabinetListResponse, KabinetStatus } from "../../../types/kabinet"
import { ExcelExchange } from "../../components/excel-exchange"
import { listProducts } from "../../lib/kabinet-api"
import { AVAILABILITY_LABEL, formatPriceFrom as money } from "../../lib/kabinet-labels"

const PAGE = 50
const ALL = "all"

const KabinetListPage = () => {
  const navigate = useNavigate()
  const [q, setQ] = useState("")
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState<KabinetListResponse | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [reload, setReload] = useState(0)

  // Search starts 400 ms after the last keystroke.
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(q.trim()); setOffset(0) }, 400)
    return () => clearTimeout(timer)
  }, [q])

  useEffect(() => {
    let live = true
    setLoading(true)
    setError("")
    listProducts({
      q: search || undefined,
      categoryId: categoryId === ALL ? undefined : categoryId,
      status: status === ALL ? undefined : (status as KabinetStatus),
      offset,
      limit: PAGE,
    })
      .then((result) => { if (live) setData(result) })
      .catch((e: Error) => { if (live) setError(e.message) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [search, categoryId, status, offset, reload])

  const pages = useMemo(() => (data ? Math.max(1, Math.ceil(data.count / PAGE)) : 1), [data])
  const page = Math.floor(offset / PAGE) + 1

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading level="h1">Товари</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {data ? `${data.count} товарів` : "Завантаження…"} · простий кабінет для фото, текстів і цін
          </Text>
        </div>
        <Button onClick={() => navigate("/prostyi-kabinet/new")}>Додати товар</Button>
      </div>

      <div className="px-6 py-4">
        <ExcelExchange onImported={() => setReload((n) => n + 1)} />
      </div>

      <div className="flex flex-wrap items-center gap-3 px-6 py-4">
        <div className="w-full max-w-sm">
          <Input type="search" placeholder="Пошук за назвою або адресою" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Пошук товарів" />
        </div>
        <div className="w-64">
          <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setOffset(0) }}>
            <Select.Trigger aria-label="Розділ"><Select.Value placeholder="Усі розділи" /></Select.Trigger>
            <Select.Content>
              <Select.Item value={ALL}>Усі розділи</Select.Item>
              {(data?.categories ?? []).map((c) => <Select.Item key={c.id} value={c.id}>{c.label}</Select.Item>)}
            </Select.Content>
          </Select>
        </div>
        <div className="w-48">
          <Select value={status} onValueChange={(v) => { setStatus(v); setOffset(0) }}>
            <Select.Trigger aria-label="Статус"><Select.Value placeholder="Усі статуси" /></Select.Trigger>
            <Select.Content>
              <Select.Item value={ALL}>Усі статуси</Select.Item>
              <Select.Item value="published">Опубліковані</Select.Item>
              <Select.Item value="draft">Чернетки</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>

      {error && <div className="px-6 py-4"><Text className="text-ui-fg-error">{error}</Text></div>}

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Фото</Table.HeaderCell>
            <Table.HeaderCell>Назва</Table.HeaderCell>
            <Table.HeaderCell>Ціна</Table.HeaderCell>
            <Table.HeaderCell>Розділ</Table.HeaderCell>
            <Table.HeaderCell>Наявність</Table.HeaderCell>
            <Table.HeaderCell>Статус</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {(data?.items ?? []).map((p) => (
            <Table.Row key={p.id} className="cursor-pointer" onClick={() => navigate(`/prostyi-kabinet/${p.id}`)}>
              <Table.Cell>
                {p.thumbnail
                  ? <img src={p.thumbnail} alt="" className="h-12 w-12 rounded-md object-cover" loading="lazy" />
                  : <div className="bg-ui-bg-subtle h-12 w-12 rounded-md" />}
              </Table.Cell>
              <Table.Cell>
                <Link to={`/prostyi-kabinet/${p.id}`} className="font-medium" onClick={(e) => e.stopPropagation()}>{p.title}</Link>
                <div className="text-ui-fg-subtle text-xs">{p.variantCount} варіантів{p.hit ? " · Хіт" : ""}</div>
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap">{money(p.minPrice)}</Table.Cell>
              <Table.Cell className="max-w-[220px] truncate">{p.categories.join(", ") || "—"}</Table.Cell>
              <Table.Cell>
                <Badge color={p.availability === "in_stock" ? "green" : p.availability === "on_order" ? "orange" : "grey"}>{AVAILABILITY_LABEL[p.availability]}</Badge>
              </Table.Cell>
              <Table.Cell>
                <Badge color={p.status === "published" ? "green" : "grey"}>{p.status === "published" ? "Опубліковано" : "Чернетка"}</Badge>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {data && data.items.length === 0 && !loading && (
        <div className="px-6 py-8"><Text className="text-ui-fg-subtle">Нічого не знайдено. Змініть пошук або фільтри.</Text></div>
      )}

      <div className="flex items-center justify-between px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">Сторінка {page} з {pages}{loading ? " · завантаження…" : ""}</Text>
        <div className="flex gap-2">
          <Button variant="secondary" size="small" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Назад</Button>
          <Button variant="secondary" size="small" disabled={page >= pages || loading} onClick={() => setOffset(offset + PAGE)}>Далі</Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Простий кабінет",
})

export default KabinetListPage
