// Content of a trust page (about, delivery, returns, contacts) in one language: what the
// page shows and its title and description for search engines.

import type { ReactNode } from "react";

export interface InfoPageContent {
  metaTitle: string;
  metaDescription: string;
  title: string;
  lead: string;
  body: ReactNode;
}
