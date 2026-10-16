// Daily at 03:30: customer fonts no order uses are deleted 30 days after the upload (ТЗ §23).

import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { customFontsDir } from "../lib/text/node-fonts";
import { deleteUnusedFonts } from "../lib/text/unused-fonts";

export default async function deleteUnusedFontsJob(container: MedusaContainer): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const deleted = await deleteUnusedFonts(customFontsDir());
  if (deleted.length) logger.info(`Customer fonts deleted after 30 days without an order: ${deleted.length}`);
}

export const config = {
  name: "delete-unused-customer-fonts",
  schedule: "30 3 * * *",
};
