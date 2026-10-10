import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { InfoPage } from "@/components/layout/InfoPage";
import { UploadOrder } from "@/components/upload/UploadOrder";

export const metadata: Metadata = pageMeta({
  title: "Трафарет за вашим макетом — ціна одразу",
  description: "Завантажте DXF, AI, EPS, PDF, SVG, CDR або картинку, вкажіть розмір і матеріал — ціна одразу. Перевіримо макет до порізки.",
  path: "/na-zamovlennia",
});

export default function UploadPage() {
  return (
    <InfoPage title="Трафарет за вашим макетом" lead="Завантажте файл, вкажіть розмір і матеріал. Ціну видно одразу, макет перевіримо до порізки.">
      <UploadOrder />
    </InfoPage>
  );
}
