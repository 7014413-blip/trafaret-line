// query.graph of a request, bound, for the order file helpers.

import type { MedusaRequest } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { QueryGraph } from "../../types/order-files";

export function requestGraph(req: MedusaRequest): QueryGraph {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as { graph: QueryGraph };
  return query.graph.bind(query);
}
