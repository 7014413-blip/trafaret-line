// Whether the shop has been set up (region Ukraine, sales channel, publishable key), so a
// staging start runs the seed only on an empty database.

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function hasStoreSetup(container: ExecArgs["container"]): Promise<boolean> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: regions } = await query.graph({ entity: "region", fields: ["id"] })
  return regions.length > 0
}
