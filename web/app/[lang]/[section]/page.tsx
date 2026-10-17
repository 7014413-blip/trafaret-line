import type { Metadata } from "next";
import { CategoryPage, categoryMetadata } from "@/components/catalog/CategoryPage";
import { localeOf } from "@/lib/i18n/locales";

type Props = { params: Promise<{ lang: string; section: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, section } = await params;
  return categoryMetadata([section], localeOf(lang));
}

export default async function SectionPage({ params }: Props) {
  const { lang, section } = await params;
  return <CategoryPage segments={[section]} locale={localeOf(lang)} />;
}
