// The reviews module of a request scope.

import type { MedusaContainer } from "@medusajs/framework/types"
import { REVIEW_MODULE } from "../../modules/review"
import type ReviewModuleService from "../../modules/review/service"

export function reviewStore(scope: MedusaContainer): ReviewModuleService {
  return scope.resolve<ReviewModuleService>(REVIEW_MODULE)
}
