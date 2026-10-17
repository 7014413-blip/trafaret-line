// Any address no page answers: the site's own «Сторінку не знайдено» (app/[lang]/not-found.tsx).

import { notFound } from "next/navigation";

export default function UnknownPage(): never {
  notFound();
}
