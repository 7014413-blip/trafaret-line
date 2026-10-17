// Date of a review as the site shows it: «16 жовтня 2026».

export function formatReviewDate(iso: string): string {
  return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Kyiv" }).format(new Date(iso)).replace(/\s*р\.$/, "");
}
