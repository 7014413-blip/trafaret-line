import assert from "node:assert/strict"
import { mkdtempSync, promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import { test } from "node:test"
import { newDraft } from "../src/lib/draft"
import { Inbox } from "../src/lib/inbox"
import { INTAKE_ID_RE, makeIntakeId } from "../src/lib/intake-id"
import { StateStore } from "../src/lib/state-store"
import type { Intake } from "../src/types/intake"

test("id заявки за схемою конвеєра", () => {
  const id = makeIntakeId(new Date("2026-10-10T20:15:00Z"))
  assert.match(id, /^20261010-201500-tg-[a-z0-9]{4}$/)
  assert.match(id, INTAKE_ID_RE)
})

test("заявка: staging → <inbox>/<id> з intake.json, status.json і фото", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "inbox-"))
  const inbox = new Inbox(root)
  await inbox.ensure()

  let draft = newDraft(10, 777)
  await inbox.saveDraftFile(draft.draftId, "photo", "01.jpg", Buffer.from("jpeg"))
  await inbox.saveDraftFile(draft.draftId, "layout", "maket.svg", Buffer.from("<svg/>"))
  draft = {
    ...draft,
    rawText: ["тірамісу Ø34 PET 350 грн"],
    files: [
      { name: "01.jpg", kind: "photo", uniqueId: "a" },
      { name: "maket.svg", kind: "layout", uniqueId: "b" },
    ],
    product: { ...draft.product, kind: "ready", category_handle: "food-tiramisu", price_uah: 350, sizes_mm: [[340, 340]] },
  }

  const intake = await inbox.submit(draft, new Date("2026-10-10T20:15:00Z"))
  const dir = path.join(root, intake.id)
  const written = JSON.parse(await fs.readFile(path.join(dir, "intake.json"), "utf8")) as Intake
  assert.equal(written.source, "telegram")
  assert.equal(written.priority, "now")
  assert.equal(written.telegram_id, 777)
  assert.equal(written.raw_text, "тірамісу Ø34 PET 350 грн")
  assert.equal(written.ref, null)
  assert.equal(written.product.category_handle, "food-tiramisu")
  assert.equal(written.product.publish, "button")
  assert.equal(await fs.readFile(path.join(dir, "photos", "01.jpg"), "utf8"), "jpeg")
  assert.equal(await fs.readFile(path.join(dir, "layout", "maket.svg"), "utf8"), "<svg/>")
  await assert.rejects(fs.access(inbox.stagingDir(draft.draftId)))

  const status = await inbox.readStatus(intake.id)
  assert.equal(status?.status, "new")

  await fs.writeFile(
    path.join(dir, "status.json"),
    JSON.stringify({ status: "draft", updated_at: "x", note: "готово", medusa_handle: "tiramisu-34" }),
  )
  const next = await inbox.readStatus(intake.id)
  assert.equal(next?.status, "draft")
  assert.equal(next?.medusa_handle, "tiramisu-34")

  await fs.writeFile(path.join(dir, "status.json"), JSON.stringify({ status: "щось інше" }))
  assert.equal(await inbox.readStatus(intake.id), null)
})

test("стан бота переживає перезапуск", async () => {
  const file = path.join(mkdtempSync(path.join(os.tmpdir(), "state-")), "bot-state.json")
  const store = new StateStore(file)
  await store.load()
  await store.saveDraft(newDraft(1, 42))
  await store.saveTracked({
    id: "20261010-201500-tg-abcd",
    chatId: 1,
    createdAt: "2026-10-10T20:15:00Z",
    lastStatus: "new",
    medusaHandle: null,
    publishedByBot: false,
  })
  const reloaded = new StateStore(file)
  await reloaded.load()
  assert.equal(reloaded.draftForUser(42)?.telegramId, 42)
  assert.equal(reloaded.trackedById("20261010-201500-tg-abcd")?.lastStatus, "new")
})
