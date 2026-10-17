// Daily at 04:00: cached sizes of catalogue master layouts nobody ordered for 90 days are deleted.

import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { cleanMasterCache } from "../lib/masters/clean-master-cache";
import { mastersCacheDir } from "../lib/masters/masters-dir";

export default async function cleanMasterCacheJob(container: MedusaContainer): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const deleted = await cleanMasterCache(mastersCacheDir());
  if (deleted.length) logger.info(`Master layout sizes deleted after 90 days without an order: ${deleted.length}`);
}

export const config = {
  name: "clean-master-layout-cache",
  schedule: "0 4 * * *",
};
