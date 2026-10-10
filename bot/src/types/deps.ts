import type { Inbox } from "../lib/inbox"
import type { MedusaAdmin } from "../lib/medusa"
import type { StateStore } from "../lib/state-store"
import type { UserLock } from "../lib/user-lock"
import type { CatalogLookup } from "./catalog"
import type { BotConfig } from "./config"

/** Усе, що потрібно обробникам бота. */
export interface BotDeps {
  config: BotConfig
  catalog: CatalogLookup
  store: StateStore
  inbox: Inbox
  medusa: MedusaAdmin
  lock: UserLock
}
