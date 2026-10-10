import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/** Finds the storefront sales channel by name and the default shipping profile. */
export async function resolveStoreSetup(container: ExecArgs["container"], salesChannelName: string): Promise<{ salesChannelId: string; shippingProfileId: string }> {
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)

  const channels = await salesChannelModule.listSalesChannels({ name: salesChannelName })
  const channel = channels[0]
  if (!channel) {
    const all = await salesChannelModule.listSalesChannels({})
    const names = all.map((c) => `"${c.name}"`).join(", ") || "none"
    throw new Error(`Sales channel "${salesChannelName}" not found (existing: ${names}). Create it or set SALES_CHANNEL_NAME.`)
  }
  const profiles = await fulfillmentModule.listShippingProfiles({ type: "default" })
  const profile = profiles[0]
  if (!profile) {
    throw new Error("No default shipping profile found. Run the Medusa seed or create one in the admin.")
  }
  return { salesChannelId: channel.id, shippingProfileId: profile.id }
}
