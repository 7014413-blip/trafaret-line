import type { Metadata } from "next";
import { CategoryPage, categoryMetadata } from "@/components/catalog/CategoryPage";

type Props = { params: Promise<{ section: string; sub: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section, sub } = await params;
  return categoryMetadata([section, sub]);
}

export default async function SubsectionPage({ params }: Props) {
  const { section, sub } = await params;
  return <CategoryPage segments={[section, sub]} />;
}
