// Lines of an order in the order the customer placed them: metadata.position (set at checkout),
// older orders by creation time.

interface SortableItem {
  id: string;
  created_at?: string | Date;
  metadata?: Record<string, unknown> | null;
}

const positionOf = (item: SortableItem) => (typeof item.metadata?.position === "number" ? item.metadata.position : Number.MAX_SAFE_INTEGER);

export function sortOrderItems<T extends SortableItem>(items: readonly T[]): T[] {
  return [...items].sort((a, b) =>
    positionOf(a) - positionOf(b) || String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")) || a.id.localeCompare(b.id));
}
