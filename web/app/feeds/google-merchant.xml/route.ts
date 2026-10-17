// /feeds/google-merchant.xml: every published product variant for Google Merchant Center and
// the Meta catalogue (dynamic remarketing, Shopping ads). Rebuilt hourly; while the shop is
// offline the last good copy keeps being served and a first request gets 503.

import { listAllProducts, listCategories } from "@/services/medusa-store";
import { merchantItems } from "@/lib/feeds/merchant-items";
import { merchantFeedXml } from "@/lib/feeds/merchant-xml";
import { siteUrl } from "@/lib/seo/site-url";

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const base = siteUrl();
  try {
    const [products, { all }] = await Promise.all([listAllProducts(), listCategories()]);
    const body = merchantFeedXml({
      title: "Trafaret Line",
      link: `${base}/`,
      description: "Трафарети, заготовки з акрилу і ПЕТ від виробника",
      items: products.flatMap((product) => merchantItems(product, all, base)),
    });
    return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
  } catch (error) {
    console.error("[feed] catalogue is not available", error);
    return new Response("Каталог тимчасово недоступний", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "600" } });
  }
}
