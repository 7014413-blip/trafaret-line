// «Обмін і повернення» in every language of the site.

import { Card } from "@/components/layout/InfoPage";
import type { Dictionary } from "@/types/i18n";
import type { InfoPageContent } from "@/types/info-page";

export const RETURNS_PAGE: Dictionary<InfoPageContent> = {
  uk: {
    metaTitle: "Обмін і повернення",
    metaDescription: "Готові трафарети — обмін і повернення 14 днів. Індивідуальні вироби — заміна або повернення коштів, якщо брак.",
    title: "Обмін і повернення",
    lead: "Хочемо, щоб трафарет працював. Якщо щось не так, напишіть нам — вирішимо швидко.",
    body: (
      <>
        <Card>
          <h2>Готові трафарети з каталогу</h2>
          <p>Обмін або повернення протягом 14 днів після отримання, якщо виріб не використовувався і має товарний вигляд. Доставку повернення оплачує покупець, якщо причина не в браку.</p>
        </Card>
        <Card>
          <h2>Індивідуальні вироби</h2>
          <p>Трафарети з вашим текстом, за вашим макетом і вивіски виготовляються саме для вас, тому повертаються лише при браку: переробимо безкоштовно або повернемо кошти. До порізки ми надсилаємо превʼю на погодження.</p>
        </Card>
        <Card>
          <h2>Як оформити</h2>
          <ul>
            <li>Напишіть у Viber або Telegram номер замовлення і фото виробу.</li>
            <li>Відповімо протягом робочого дня і запропонуємо рішення.</li>
            <li>Гроші повертаємо тим самим способом оплати, з чеком повернення.</li>
          </ul>
          <p className="text-[13px] text-[var(--muted)]">Умови буде звірено з юристом перед запуском.</p>
        </Card>
      </>
    ),
  },
  ru: {
    metaTitle: "Обмен и возврат",
    metaDescription: "Готовые трафареты — обмен и возврат 14 дней. Индивидуальные изделия — замена или возврат денег, если брак.",
    title: "Обмен и возврат",
    lead: "Хотим, чтобы трафарет работал. Если что-то не так, напишите нам — решим быстро.",
    body: (
      <>
        <Card>
          <h2>Готовые трафареты из каталога</h2>
          <p>Обмен или возврат в течение 14 дней после получения, если изделие не использовалось и сохранило товарный вид. Доставку возврата оплачивает покупатель, если причина не в браке.</p>
        </Card>
        <Card>
          <h2>Индивидуальные изделия</h2>
          <p>Трафареты с вашим текстом, по вашему макету и вывески изготавливаются именно для вас, поэтому возвращаются только при браке: переделаем бесплатно или вернём деньги. До порезки мы присылаем превью на согласование.</p>
        </Card>
        <Card>
          <h2>Как оформить</h2>
          <ul>
            <li>Напишите в Viber или Telegram номер заказа и фото изделия.</li>
            <li>Ответим в течение рабочего дня и предложим решение.</li>
            <li>Деньги возвращаем тем же способом оплаты, с чеком возврата.</li>
          </ul>
          <p className="text-[13px] text-[var(--muted)]">Условия будут сверены с юристом перед запуском.</p>
        </Card>
      </>
    ),
  },  en: {
    metaTitle: "Exchanges and returns",
    metaDescription: "Ready-made stencils: 14-day exchanges and returns. Custom items: replacement or refund if defective.",
    title: "Exchanges and returns",
    lead: "We want your stencil to work. If something is wrong, message us and we will sort it out quickly.",
    body: (
      <>
        <Card>
          <h2>Ready-made stencils from the catalog</h2>
          <p>Exchange or return within 14 days of receipt if the item is unused and in its original condition. The customer pays return shipping unless the item is defective.</p>
        </Card>
        <Card>
          <h2>Custom items</h2>
          <p>Stencils with your text, made from your design, and signs are made just for you, so they can only be returned if defective: we will remake them for free or refund your money. Before cutting, we send you a preview to approve.</p>
        </Card>
        <Card>
          <h2>How to request</h2>
          <ul>
            <li>Send us your order number and a photo of the item via Viber or Telegram.</li>
            <li>We will reply within one business day and offer a solution.</li>
            <li>We refund using the same payment method, with a refund receipt.</li>
          </ul>
          <p className="text-[13px] text-[var(--muted)]">These terms will be reviewed by a lawyer before launch.</p>
        </Card>
      </>
    ),
  },
};
