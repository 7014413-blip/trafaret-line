// «Доставка і оплата» in every language of the site.

import { Card } from "@/components/layout/InfoPage";
import type { Dictionary } from "@/types/i18n";
import type { InfoPageContent } from "@/types/info-page";

export const DELIVERY_PAGE: Dictionary<InfoPageContent> = {
  uk: {
    metaTitle: "Доставка і оплата",
    metaDescription: "Нова пошта, Укрпошта, курʼєр. Оплата карткою, Apple Pay, Google Pay, при отриманні або за рахунком. Виготовлення 3 робочі дні.",
    title: "Доставка і оплата",
    lead: "Виготовляємо за 3 робочі дні й відправляємо з Борисполя або Запоріжжя. Точну дату відправки видно в картці товару і в кошику.",
    body: (
      <>
        <Card>
          <h2>Доставка</h2>
          <ul>
            <li><b>Нова пошта</b>: відділення, поштомат або курʼєр. Вартість — за тарифом перевізника, оплачується при отриманні.</li>
            <li><b>Укрпошта</b>: за тарифом Укрпошти.</li>
            <li>Тонкий PET до 0,8 мм відправляємо в тубусі, жорсткі матеріали — у плоскій коробці.</li>
            <li>Номер ТТН надсилаємо у Viber або Telegram у день відправки.</li>
          </ul>
        </Card>
        <Card>
          <h2>Оплата</h2>
          <ul>
            <li>Карткою онлайн, Apple Pay, Google Pay (WayForPay).</li>
            <li>Накладений платіж при отриманні на Новій пошті.</li>
            <li>За рахунком для ФОП і ТОВ, без ПДВ.</li>
          </ul>
          <p>Фіскальний чек надходить на телефон або e-mail після оплати.</p>
        </Card>
        <Card>
          <h2>Строки</h2>
          <p>Виготовлення до 3 робочих днів. Замовлення після 14:00 рахуємо з наступного робочого дня. Великі й складені трафарети, вивіски під замовлення — строк підтверджує менеджер.</p>
        </Card>
      </>
    ),
  },
  ru: {
    metaTitle: "Доставка и оплата",
    metaDescription: "Новая почта, Укрпочта, курьер. Оплата картой, Apple Pay, Google Pay, при получении или по счёту. Изготовление 3 рабочих дня.",
    title: "Доставка и оплата",
    lead: "Изготавливаем за 3 рабочих дня и отправляем из Борисполя или Запорожья. Точную дату отправки видно в карточке товара и в корзине.",
    body: (
      <>
        <Card>
          <h2>Доставка</h2>
          <ul>
            <li><b>Новая почта</b>: отделение, почтомат или курьер. Стоимость — по тарифу перевозчика, оплачивается при получении.</li>
            <li><b>Укрпочта</b>: по тарифу Укрпочты.</li>
            <li>Тонкий PET до 0,8 мм отправляем в тубусе, жёсткие материалы — в плоской коробке.</li>
            <li>Номер ТТН присылаем в Viber или Telegram в день отправки.</li>
          </ul>
        </Card>
        <Card>
          <h2>Оплата</h2>
          <ul>
            <li>Картой онлайн, Apple Pay, Google Pay (WayForPay).</li>
            <li>Наложенный платёж при получении на Новой почте.</li>
            <li>По счёту для ФЛП и ООО, без НДС.</li>
          </ul>
          <p>Фискальный чек приходит на телефон или e-mail после оплаты.</p>
        </Card>
        <Card>
          <h2>Сроки</h2>
          <p>Изготовление до 3 рабочих дней. Заказы после 14:00 считаем со следующего рабочего дня. Большие и составные трафареты, вывески под заказ — срок подтверждает менеджер.</p>
        </Card>
      </>
    ),
  },  en: {
    metaTitle: "Delivery and payment",
    metaDescription: "Nova Poshta, Ukrposhta, courier. Pay by card, Apple Pay, Google Pay, on delivery or by invoice. Made in 3 business days.",
    title: "Delivery and payment",
    lead: "We make your order in 3 business days and ship it from Boryspil or Zaporizhzhia. The exact dispatch date is shown on the product page and in the cart.",
    body: (
      <>
        <Card>
          <h2>Delivery</h2>
          <ul>
            <li><b>Nova Poshta</b>: branch, parcel locker or courier. Shipping is charged at the carrier&apos;s rates and paid on delivery.</li>
            <li><b>Ukrposhta</b>: at Ukrposhta rates.</li>
            <li>Thin PET up to 0.8 mm ships in a tube, rigid materials in a flat box.</li>
            <li>We send the tracking number via Viber or Telegram on the day of dispatch.</li>
          </ul>
        </Card>
        <Card>
          <h2>Payment</h2>
          <ul>
            <li>Online by card, Apple Pay, Google Pay (WayForPay).</li>
            <li>Cash on delivery at Nova Poshta.</li>
            <li>By invoice for sole proprietors (FOP) and companies (TOV), no VAT.</li>
          </ul>
          <p>A fiscal receipt is sent to your phone or email after payment.</p>
        </Card>
        <Card>
          <h2>Lead times</h2>
          <p>Production takes up to 3 business days. Orders placed after 14:00 count from the next business day. For large and multi-part stencils and custom signs, the manager confirms the lead time.</p>
        </Card>
      </>
    ),
  },
};
