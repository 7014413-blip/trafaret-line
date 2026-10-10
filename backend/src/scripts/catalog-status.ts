// Switches catalogue products between draft and published.
//   CATALOG_ACTION=publish-imported  publishes every product created by import-catalog.ts
//                                    (has metadata.catalog_type) and hides the seed demo
//                                    products of seed-trafaret.ts (metadata.type = "ready").
//   CATALOG_ACTION=draft-imported    returns imported products to drafts.
//   CATALOG_ACTION=reset-imported    deletes imported products and every category, so the
//                                    next import-catalog.ts run recreates them from the
//                                    current catalog/data (new photos, new category links).
//                                    Local catalogue rebuild only: orders keep their lines.
// Run: CATALOG_ACTION=publish-imported npx medusa exec ./src/scripts/catalog-status.ts
// On the laptop this shows the whole catalogue for review; on the server the owner
// publishes products one by one in the admin after approval.

import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils";
import { deleteProductCategoriesWorkflow, deleteProductsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows";

type Row = { id: string; handle: string; status: string; metadata: Record<string, unknown> | null };

export default async function catalogStatus({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const action = process.env.CATALOG_ACTION;
  if (action !== "publish-imported" && action !== "draft-imported" && action !== "reset-imported") {
    throw new Error("Set CATALOG_ACTION to publish-imported, draft-imported or reset-imported");
  }

  const rows: Row[] = [];
  for (let skip = 0; ; skip += 200) {
    const { data } = await query.graph({ entity: "product", fields: ["id", "handle", "status", "metadata"], pagination: { skip, take: 200 } });
    rows.push(...(data as Row[]));
    if (data.length < 200) break;
  }
  const imported = rows.filter((r) => r.metadata && "catalog_type" in r.metadata);
  const demo = rows.filter((r) => r.metadata && !("catalog_type" in r.metadata) && r.metadata.type === "ready");

  if (action === "reset-imported") {
    for (let i = 0; i < imported.length; i += 50) {
      await deleteProductsWorkflow(container).run({ input: { ids: imported.slice(i, i + 50).map((r) => r.id) } });
    }
    const { data: categories } = await query.graph({ entity: "product_category", fields: ["id", "parent_category_id"] });
    // Children first, then parents.
    const list = categories as { id: string; parent_category_id: string | null }[];
    const children = list.filter((c) => c.parent_category_id).map((c) => c.id);
    const parents = list.filter((c) => !c.parent_category_id).map((c) => c.id);
    for (const ids of [children, parents]) {
      for (const id of ids) await deleteProductCategoriesWorkflow(container).run({ input: [id] });
    }
    logger.info(`Deleted ${imported.length} imported products and ${list.length} categories.`);
    return;
  }

  const target = action === "publish-imported" ? ProductStatus.PUBLISHED : ProductStatus.DRAFT;
  const toChange = imported.filter((r) => r.status !== target);
  for (let i = 0; i < toChange.length; i += 50) {
    const batch = toChange.slice(i, i + 50);
    await updateProductsWorkflow(container).run({ input: { products: batch.map((r) => ({ id: r.id, status: target })) } });
  }
  logger.info(`Imported products set to ${target}: ${toChange.length} changed, ${imported.length} in total.`);

  if (action === "publish-imported") {
    const visibleDemo = demo.filter((r) => r.status !== ProductStatus.DRAFT);
    if (visibleDemo.length) {
      await updateProductsWorkflow(container).run({ input: { products: visibleDemo.map((r) => ({ id: r.id, status: ProductStatus.DRAFT })) } });
    }
    logger.info(`Seed demo products hidden: ${visibleDemo.length}.`);
  }
}
