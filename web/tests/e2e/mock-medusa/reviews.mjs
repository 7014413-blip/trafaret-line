// Reviews of the mock shop: two published reviews of the rose stencil (one with a photo and a
// shop answer, one whose text tries to close the JSON-LD script) and one order whose review
// link is /vidguk/order_review?t=e2e-review.

export const REVIEW_ORDER = { id: "order_review", token: "e2e-review", number: "TL-2001" };

export function publishedReviews(origin) {
  return [
    {
      id: "rev_1", productHandle: "trafaret-troiandy", productTitle: "Трафарет троянди", name: "Олена", city: "Київ", rating: 5,
      text: "Трафарет щільно лягає на торт, малюнок вийшов чіткий.", photos: [`${origin}/tl-media/reviews/rev_1-1.jpg`],
      shopReply: "Дякуємо, Олено!", publishedAt: "2026-10-14T09:00:00.000Z", source: "site",
    },
    {
      id: "rev_2", productHandle: "trafaret-troiandy", productTitle: "Трафарет троянди", name: "Ігор", city: null, rating: 4,
      text: "Все добре </script><b>жирно</b>", photos: [], shopReply: null, publishedAt: "2026-10-12T09:00:00.000Z", source: "topperok",
    },
  ];
}

export function reviewList(origin, query) {
  const product = query.get("product");
  const all = publishedReviews(origin);
  const list = product ? all.filter((r) => r.productHandle === product) : all;
  const average = list.length ? Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10 : 0;
  return { reviews: list, summary: { count: list.length, average }, total: list.length };
}

export function reviewOrder(received) {
  const done = new Set(received.map((r) => r.key));
  return {
    orderNumber: REVIEW_ORDER.number,
    subjects: [
      { key: "trafaret-troiandy", productHandle: "trafaret-troiandy", title: "Трафарет троянди", image: null, reviewed: done.has("trafaret-troiandy") },
      { key: "order", productHandle: null, title: "Свій напис «КАВА»", image: null, reviewed: done.has("order") },
    ],
  };
}
