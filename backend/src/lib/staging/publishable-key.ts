// A staging copy builds the storefront before its database exists, so the storefront's
// publishable key is chosen in advance (STAGING_PUBLISHABLE_KEY, "pk_" + 64 hex characters)
// and written onto the key the seed created. Publishable keys are public by design: they sit
// in the storefront's JavaScript and only open the Store API of one sales channel.

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const FORMAT = /^pk_[0-9a-f]{64}$/

/** Checks the format the storefront expects; throws with the reason when it is wrong. */
export function assertPublishableKey(token: string): void {
  if (!FORMAT.test(token)) {
    throw new Error('STAGING_PUBLISHABLE_KEY must be "pk_" followed by 64 lowercase hex characters (openssl rand -hex 32)')
  }
}

/** Same masking Medusa shows in the admin: first and last characters only. */
export function redactPublishableKey(token: string): string {
  return `${token.slice(0, 6)}***${token.slice(-3)}`
}

/**
 * Gives the first publishable key the fixed token. Medusa stores publishable tokens as they
 * are (only secret keys are hashed), so the storefront authenticates with it right away.
 * Returns true when the token changed, false when it already matched.
 */
export async function pinPublishableKey(container: ExecArgs["container"], token: string): Promise<boolean> {
  assertPublishableKey(token)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: keys } = await query.graph({ entity: "api_key", fields: ["id", "token"], filters: { type: "publishable" } })
  if (keys.length === 0) {
    throw new Error("No publishable key yet: run the seed first")
  }
  const [key] = keys
  if (key.token === token) {
    return false
  }
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  await db("api_key").where({ id: key.id }).update({ token, redacted: redactPublishableKey(token), updated_at: new Date() })
  return true
}
