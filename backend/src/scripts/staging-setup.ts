// Prepares a staging copy on every start (deploy/staging/backend-start.sh), after migrations:
//   1. an empty database gets the shop setup and demo products of seed-trafaret.ts;
//   2. the storefront's publishable key gets the fixed STAGING_PUBLISHABLE_KEY.
// Safe to run again: a set-up shop is left as it is and a matching key is not touched.
// Run: STAGING_PUBLISHABLE_KEY=pk_… npx medusa exec ./src/scripts/staging-setup.ts

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { pinPublishableKey, redactPublishableKey } from "../lib/staging/publishable-key"
import { hasStoreSetup } from "../lib/staging/store-ready"
import seedTrafaret from "./seed-trafaret"

export default async function stagingSetup(args: ExecArgs): Promise<void> {
  const logger = args.container.resolve(ContainerRegistrationKeys.LOGGER)

  if (await hasStoreSetup(args.container)) {
    logger.info("Staging setup: the shop is already set up, seed skipped")
  } else {
    logger.info("Staging setup: empty database, running the seed")
    await seedTrafaret(args)
  }

  const token = process.env.STAGING_PUBLISHABLE_KEY?.trim()
  if (!token) {
    logger.warn("Staging setup: STAGING_PUBLISHABLE_KEY is not set, the storefront key stays as the seed made it")
    return
  }
  const changed = await pinPublishableKey(args.container, token)
  logger.info(`Staging setup: storefront key ${redactPublishableKey(token)} ${changed ? "set" : "already in place"}`)
}
