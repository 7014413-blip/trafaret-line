// «Простий кабінет» → product form on one page (Prom.ua-like, Денис 10.10):
// name, short text, description, photos (drag in, reorder, alt), categories, the price
// table size × material, availability, «Хіт», features, FAQ and SEO. /prostyi-kabinet/new
// creates a product, /prostyi-kabinet/<id> edits one.

import { Badge, Button, Checkbox, Container, Heading, Input, Label, Select, Switch, Text, Textarea, toast } from "@medusajs/ui"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import type { KabinetCategory, KabinetProduct, KabinetProductInput, ProductAvailability } from "../../../../types/kabinet"
import { getProduct, KabinetApiError, listProducts, saveProduct, uploadPhotos } from "../../../lib/kabinet-api"
import {
  addAxisValue, changeAllPrices, emptyFaq, emptyInput, moveImage, priceAt, removeAxisValue, renameAxisValue, setPrice, toInput, updateList,
} from "../../../lib/kabinet-form"
import { AVAILABILITY_LABEL } from "../../../lib/kabinet-labels"

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3 px-6 py-5">
    <div>
      <Heading level="h2">{title}</Heading>
      {hint && <Text size="small" className="text-ui-fg-subtle">{hint}</Text>}
    </div>
    {children}
  </section>
)

const Field = ({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {error && <Text size="small" className="text-ui-fg-error" id={`${id}-error`}>{error}</Text>}
  </div>
)

const KabinetProductPage = () => {
  const { id = "new" } = useParams()
  const isNew = id === "new"
  const navigate = useNavigate()
  const [product, setProduct] = useState<KabinetProduct | null>(null)
  const [form, setForm] = useState<KabinetProductInput>(emptyInput())
  const [categories, setCategories] = useState<KabinetCategory[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newSize, setNewSize] = useState("")
  const [newMaterial, setNewMaterial] = useState("")
  const [percent, setPercent] = useState("")
  const [dirty, setDirty] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listProducts({ limit: 1 }).then((r) => setCategories(r.categories)).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (isNew) { setForm(emptyInput()); setProduct(null); setLoading(false); return }
    let live = true
    setLoading(true)
    getProduct(id)
      .then((p) => { if (live) { setProduct(p); setForm(toInput(p)); setDirty(false) } })
      .catch((e: Error) => { if (live) toast.error(e.message) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [id, isNew])

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const update = (next: KabinetProductInput) => { setForm(next); setDirty(true) }
  const set = <K extends keyof KabinetProductInput>(key: K, value: KabinetProductInput[K]) => {
    update({ ...form, [key]: value })
    if (errors[key as string]) setErrors((e) => { const n = { ...e }; delete n[key as string]; return n })
  }

  const minPrice = useMemo(() => (form.prices.length ? Math.min(...form.prices.map((p) => p.price)) : null), [form.prices])

  const addPhotos = async (files: FileList | File[] | null) => {
    const list = Array.from(files ?? []).filter((f) => /^image\/(jpeg|png|webp|avif)$/.test(f.type))
    if (!list.length) { toast.error("Оберіть фото у форматі JPG, PNG, WebP або AVIF"); return }
    setUploading(true)
    try {
      const urls = await uploadPhotos(list)
      set("images", [...form.images, ...urls.map((url) => ({ url, alt: "" }))])
      toast.success(`Додано фото: ${urls.length}`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setErrors({})
    try {
      const saved = await saveProduct(isNew ? null : id, form)
      setProduct(saved)
      setForm(toInput(saved))
      setDirty(false)
      toast.success(isNew ? "Товар створено" : "Збережено, на сайті оновиться протягом хвилини")
      if (isNew) navigate(`/prostyi-kabinet/${saved.id}`, { replace: true })
    } catch (e) {
      const err = e as KabinetApiError
      if (err.field) setErrors({ [err.field]: err.message })
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Container><Text>Завантаження товару…</Text></Container>

  return (
    <div className="flex flex-col gap-4">
      <Container className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex flex-col gap-1">
          <Link to="/prostyi-kabinet" className="text-ui-fg-subtle text-sm">← Усі товари</Link>
          <Heading level="h1">{isNew ? "Новий товар" : form.title || "Товар"}</Heading>
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={form.status === "published" ? "green" : "grey"}>{form.status === "published" ? "Опубліковано" : "Чернетка"}</Badge>
            {minPrice != null && <Text size="small" className="text-ui-fg-subtle">Ціна на сайті: від {minPrice} ₴</Text>}
            {product && <a href={product.storefrontUrl} target="_blank" rel="noreferrer" className="text-ui-fg-interactive text-sm">Відкрити на сайті ↗</a>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="k-status" checked={form.status === "published"} onCheckedChange={(on) => set("status", on ? "published" : "draft")} />
            <Label htmlFor="k-status">Показувати на сайті</Label>
          </div>
          <Button onClick={save} isLoading={saving} disabled={uploading}>Зберегти</Button>
        </div>
      </Container>

      <Container className="divide-y p-0">
        <Section title="Основне">
          <Field id="k-title" label="Назва товару" error={errors.title}>
            <Input id="k-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Трафарет «Мандала»" aria-invalid={!!errors.title} />
          </Field>
          {isNew && (
            <Field id="k-handle" label="Адреса на сайті (латиницею, можна не заповнювати)" error={errors.handle}>
              <Input id="k-handle" value={form.handle ?? ""} onChange={(e) => set("handle", e.target.value)} placeholder="mandala-kruhla" />
            </Field>
          )}
          <Field id="k-subtitle" label="Короткий опис (під назвою)">
            <Input id="k-subtitle" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <Field id="k-desc" label="Опис (можна абзаци, списки, жирний текст у HTML)">
            <Textarea id="k-desc" rows={8} value={form.descriptionHtml} onChange={(e) => set("descriptionHtml", e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-6">
            <div className="w-56">
              <Field id="k-availability" label="Наявність">
                <Select value={form.availability} onValueChange={(v) => set("availability", v as ProductAvailability)}>
                  <Select.Trigger id="k-availability"><Select.Value /></Select.Trigger>
                  <Select.Content>
                    {(Object.keys(AVAILABILITY_LABEL) as ProductAvailability[]).map((a) => <Select.Item key={a} value={a}>{AVAILABILITY_LABEL[a]}</Select.Item>)}
                  </Select.Content>
                </Select>
              </Field>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="k-hit" checked={form.hit} onCheckedChange={(v) => set("hit", v === true)} />
              <Label htmlFor="k-hit">Позначка «Хіт» (першим у розділі)</Label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="k-new" checked={form.isNew} onCheckedChange={(v) => set("isNew", v === true)} />
              <Label htmlFor="k-new">Позначка «Новинка» на картці</Label>
            </div>
          </div>
        </Section>

        <Section title="Фото" hint="Перше фото головне. Перетягніть файли сюди або натисніть «Додати фото».">
          {errors.images && <Text size="small" className="text-ui-fg-error">{errors.images}</Text>}
          <div
            className="border-ui-border-strong flex min-h-[120px] flex-wrap gap-3 rounded-lg border border-dashed p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); void addPhotos(e.dataTransfer.files) }}
          >
            {form.images.map((img, i) => (
              <div key={img.url} className="flex w-40 flex-col gap-1.5">
                <img src={img.url} alt={img.alt} className="h-40 w-40 rounded-md object-cover" />
                <Input size="small" placeholder="Опис фото (alt)" value={img.alt} aria-label={`Опис фото ${i + 1}`}
                  onChange={(e) => set("images", updateList(form.images, i, { ...img, alt: e.target.value }))} />
                <div className="flex gap-1">
                  <Button size="small" variant="secondary" disabled={i === 0} onClick={() => set("images", moveImage(form.images, i, i - 1))} aria-label="Посунути ліворуч">←</Button>
                  <Button size="small" variant="secondary" disabled={i === form.images.length - 1} onClick={() => set("images", moveImage(form.images, i, i + 1))} aria-label="Посунути праворуч">→</Button>
                  <Button size="small" variant="danger" onClick={() => set("images", form.images.filter((_, j) => j !== i))}>Видалити</Button>
                </div>
                {i === 0 && <Badge size="2xsmall" color="blue">Головне</Badge>}
              </div>
            ))}
            <div className="flex items-center">
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => { void addPhotos(e.target.files); e.target.value = "" }} />
              <Button variant="secondary" isLoading={uploading} onClick={() => fileInput.current?.click()}>Додати фото</Button>
            </div>
          </div>
        </Section>

        <Section title="Розділи каталогу" hint="Товар показується в кожному обраному розділі.">
          {errors.categoryIds && <Text size="small" className="text-ui-fg-error">{errors.categoryIds}</Text>}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <Checkbox id={`k-cat-${c.id}`} checked={form.categoryIds.includes(c.id)}
                  onCheckedChange={(v) => set("categoryIds", v === true ? [...form.categoryIds, c.id] : form.categoryIds.filter((x) => x !== c.id))} />
                <Label htmlFor={`k-cat-${c.id}`}>{c.label}</Label>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Ціни" hint="Ціна за 1 шт. у гривнях. Порожня клітинка означає, що такого варіанта немає в продажу. Знижки за кількість сайт рахує сам.">
          {errors.prices && <Text size="small" className="text-ui-fg-error">{errors.prices}</Text>}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Розмір \ Матеріал</th>
                  {form.materials.map((m) => (
                    <th key={m} className="p-2 text-left align-bottom">
                      <Input size="small" defaultValue={m} aria-label={`Матеріал ${m}`} onBlur={(e) => update(renameAxisValue(form, "materials", m, e.target.value))} />
                      <Button size="small" variant="transparent" onClick={() => update(removeAxisValue(form, "materials", m))}>прибрати</Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.sizes.map((s) => (
                  <tr key={s} className="border-ui-border-base border-t">
                    <td className="p-2">
                      <Input size="small" defaultValue={s} aria-label={`Розмір ${s}`} onBlur={(e) => update(renameAxisValue(form, "sizes", s, e.target.value))} />
                      <Button size="small" variant="transparent" onClick={() => update(removeAxisValue(form, "sizes", s))}>прибрати</Button>
                    </td>
                    {form.materials.map((m) => (
                      <td key={m} className="p-2">
                        <Input size="small" inputMode="numeric" placeholder="—" aria-label={`Ціна ${s}, ${m}`}
                          value={priceAt(form, s, m)?.price ?? ""} onChange={(e) => update(setPrice(form, s, m, e.target.value))} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-end gap-2">
              <Field id="k-new-size" label="Новий розмір"><Input id="k-new-size" size="small" value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="40×40 см" /></Field>
              <Button size="small" variant="secondary" onClick={() => { update(addAxisValue(form, "sizes", newSize)); setNewSize("") }}>Додати</Button>
            </div>
            <div className="flex items-end gap-2">
              <Field id="k-new-mat" label="Новий матеріал"><Input id="k-new-mat" size="small" value={newMaterial} onChange={(e) => setNewMaterial(e.target.value)} placeholder="Акрил 3 мм" /></Field>
              <Button size="small" variant="secondary" onClick={() => { update(addAxisValue(form, "materials", newMaterial)); setNewMaterial("") }}>Додати</Button>
            </div>
            <div className="flex items-end gap-2">
              <Field id="k-percent" label="Змінити всі ціни на, %"><Input id="k-percent" size="small" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="+10 або −5" /></Field>
              <Button size="small" variant="secondary" onClick={() => { update(changeAllPrices(form, Number(percent.replace("−", "-").replace(",", ".")))); setPercent("") }}>Застосувати</Button>
            </div>
          </div>
        </Section>

        <Section title="Переваги" hint="Короткі пункти зі «✓» на сторінці товару.">
          {form.features.map((f, i) => (
            <div key={i} className="flex gap-2">
              <Input value={f} aria-label={`Перевага ${i + 1}`} onChange={(e) => set("features", updateList(form.features, i, e.target.value))} />
              <Button variant="secondary" onClick={() => set("features", form.features.filter((_, j) => j !== i))}>Видалити</Button>
            </div>
          ))}
          <div><Button size="small" variant="secondary" onClick={() => set("features", [...form.features, ""])}>Додати пункт</Button></div>
        </Section>

        <Section title="Питання й відповіді">
          {form.faq.map((f, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border p-3">
              <Input value={f.q} placeholder="Питання" aria-label={`Питання ${i + 1}`} onChange={(e) => set("faq", updateList(form.faq, i, { ...f, q: e.target.value }))} />
              <Textarea rows={3} value={f.a} placeholder="Відповідь" aria-label={`Відповідь ${i + 1}`} onChange={(e) => set("faq", updateList(form.faq, i, { ...f, a: e.target.value }))} />
              <div><Button size="small" variant="secondary" onClick={() => set("faq", form.faq.filter((_, j) => j !== i))}>Видалити</Button></div>
            </div>
          ))}
          <div><Button size="small" variant="secondary" onClick={() => set("faq", [...form.faq, emptyFaq()])}>Додати питання</Button></div>
        </Section>

        <Section title="Пошук Google (SEO)" hint="Заголовок до 60 символів, опис до 160. Порожні поля сайт заповнить з назви й опису.">
          <Field id="k-seo-title" label={`Заголовок (${form.seo.title.length})`}>
            <Input id="k-seo-title" value={form.seo.title} onChange={(e) => set("seo", { ...form.seo, title: e.target.value })} />
          </Field>
          <Field id="k-seo-desc" label={`Опис (${form.seo.description.length})`}>
            <Textarea id="k-seo-desc" rows={3} value={form.seo.description} onChange={(e) => set("seo", { ...form.seo, description: e.target.value })} />
          </Field>
        </Section>

        <div className="flex justify-end gap-2 px-6 py-4">
          <Button variant="secondary" onClick={() => navigate("/prostyi-kabinet")}>До списку</Button>
          <Button onClick={save} isLoading={saving} disabled={uploading}>Зберегти</Button>
        </div>
      </Container>
    </div>
  )
}

export default KabinetProductPage
