// «Контакти» in every language of the site.

import { BranchList, Card } from "@/components/layout/InfoPage";
import { ManagerCallButton } from "@/components/layout/ManagerCallButton";
import { SITE, SITE_TEXT } from "@/data/site";
import type { Dictionary } from "@/types/i18n";
import type { InfoPageContent } from "@/types/info-page";

const social = (
  <ul>{Object.entries(SITE.social).map(([k, v]) => <li key={k}><a href={v} target="_blank" rel="noopener" className="underline">{k[0].toUpperCase() + k.slice(1)}</a></li>)}</ul>
);

export const CONTACTS_PAGE: Dictionary<InfoPageContent> = {
  uk: {
    metaTitle: "Контакти",
    metaDescription: `Телефон ${SITE.phone}, Viber, Telegram. Бориспіль і Запоріжжя. ${SITE_TEXT.uk.hours}.`,
    title: "Контакти",
    lead: "Відповідаємо у робочий час протягом 15 хвилин.",
    body: (
      <>
        <Card>
          <h2>Звʼязок</h2>
          <p>Менеджер {SITE_TEXT.uk.managerName} відповість на питання про макет, матеріал і доставку.</p>
          <p><ManagerCallButton variant="card" locale="uk" /></p>
          <ul>
            <li>Телефон, Viber, Telegram: <b className="select-all">{SITE.phone}</b></li>
            <li>E-mail: <b className="select-all">{SITE.email}</b></li>
            <li>Графік: {SITE_TEXT.uk.hours}</li>
          </ul>
        </Card>
        <Card>
          <h2>Філіали</h2>
          <BranchList locale="uk" />
        </Card>
        <Card>
          <h2>Ми в соцмережах</h2>
          {social}
        </Card>
      </>
    ),
  },
  ru: {
    metaTitle: "Контакты",
    metaDescription: `Телефон ${SITE.phone}, Viber, Telegram. Борисполь и Запорожье. ${SITE_TEXT.ru.hours}.`,
    title: "Контакты",
    lead: "Отвечаем в рабочее время в течение 15 минут.",
    body: (
      <>
        <Card>
          <h2>Связь</h2>
          <p>Менеджер {SITE_TEXT.ru.managerName} ответит на вопросы о макете, материале и доставке.</p>
          <p><ManagerCallButton variant="card" locale="ru" /></p>
          <ul>
            <li>Телефон, Viber, Telegram: <b className="select-all">{SITE.phone}</b></li>
            <li>E-mail: <b className="select-all">{SITE.email}</b></li>
            <li>График: {SITE_TEXT.ru.hours}</li>
          </ul>
        </Card>
        <Card>
          <h2>Филиалы</h2>
          <BranchList locale="ru" />
        </Card>
        <Card>
          <h2>Мы в соцсетях</h2>
          {social}
        </Card>
      </>
    ),
  },
};
