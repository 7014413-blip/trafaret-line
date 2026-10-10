import type { Metadata } from "next";
import { CategoryPage, categoryMetadata } from "@/components/catalog/CategoryPage";

type Props = { params: Promise<{ section: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return categoryMetadata([(await params).section]);
}

export default async function SectionPage({ params }: Props) {
  return <CategoryPage segments={[(await params).section]} />;
}
