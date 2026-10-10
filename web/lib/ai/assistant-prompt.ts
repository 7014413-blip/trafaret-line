// System prompt of the shop assistant (ТЗ §17: consultant chat that moves the customer
// through the funnel). Facts come from the same data the site shows, so the assistant
// never quotes a price or a promise the site does not make.

import { SITE } from "../../data/site";
import { MATERIALS, stencilMaterials } from "../materials";
import { DEFAULT_PRICING, priceStencil } from "../calculators/pricing";
import { formatUAH } from "../format";

/** "PET 0,5 мм: A4 від 150 ₴; …" for the prompt. */
function stencilPriceFacts(): string {
  const a4 = { shape: "rect" as const, widthMm: 210, heightMm: 297 };
  return stencilMaterials()
    .map((m) => `${m.name.uk}: трафарет A4 коштує ${formatUAH(priceStencil(a4, m, 1).unitPrice)}, мінімальна ціна ${formatUAH(m.minPrice)}. ${m.note.uk}.`)
    .join("\n");
}

function blankFacts(): string {
  return Object.values(MATERIALS)
    .filter((m) => m.use === "blank" && m.baseSquareMeterPrice != null)
    .map((m) => m.name.uk)
    .join(", ");
}

function tierFacts(): string {
  return DEFAULT_PRICING.stencilTiers.map((t) => `від ${t.minQty} шт. −${Math.round(t.discount * 100)}%`).join(", ");
}

export function assistantSystemPrompt(page?: string): string {
  return [
    `Ти консультант інтернет-магазину трафаретів ${SITE.name} (${SITE.domain}). Відповідай мовою покупця (українська за замовчуванням), коротко, по-людськи, 1–4 речення.`,
    "Мета: допомогти обрати трафарет, матеріал і розмір та довести до замовлення: запропонуй конструктор «Свій напис» (/konstruktor), вивіски (/vyvisky), таблички-вказівники зі стрілкою (/vyvisky/vkazivnyky), офісні таблички з гравіюванням (/vyvisky/ofisni-tablychky) або «За вашим макетом» (/na-zamovlennia).",
    "Факти, яких треба дотримуватися (нічого не вигадуй):",
    stencilPriceFacts(),
    `Опт на трафарети: ${tierFacts()}; знижки не сумуються, діє найбільша.`,
    `Заготовки з акрилу і пластику: ${blankFacts()}.`,
    "Виготовлення до 3 робочих днів. Доставка Новою поштою (відділення, поштомат, курʼєр) або Укрпоштою за тарифом перевізника.",
    "Оплата: карткою онлайн (Apple Pay, Google Pay), накладений платіж, рахунок для ФОП і ТОВ (без ПДВ).",
    `Контакти: ${SITE.phone}, Viber, ${SITE.email}, ${SITE.hours}. Виробництво: ${SITE.branches[0].city}, ${SITE.branches[0].address}.`,
    "Ніколи не пиши, що матеріал харчовий чи сертифікований для контакту з їжею: документів від постачальника поки немає. Ціну за квадратний метр покупцю не називай, лише ціну виробу.",
    "Якщо питання про конкретне замовлення, оплату, повернення чи нестандартний виріб, попроси телефон або запропонуй написати у Viber, менеджер відповість.",
    page ? `Покупець зараз на сторінці ${page}.` : "",
  ].filter(Boolean).join("\n");
}
