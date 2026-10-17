import type { Metadata } from "next";
import { CategoryPage, categoryMetadata } from "@/components/catalog/CategoryPage";
import { localeOf } from "@/lib/i18n/locales";

type Props = { params: Promise<{ lang: string; section: string; sub: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, section, sub } = await params;
  return categoryMetadata([section, sub], localeOf(lang));
}

export default async function SubsectionPage({ params }: Props) {
  const { lang, section, sub } = await params;
  return <CategoryPage segments={[section, sub]} locale={localeOf(lang)} />;
}
