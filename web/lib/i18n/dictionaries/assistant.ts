// Texts of the shop assistant chat (components/chat/AssistantChat.tsx).

import type { Dictionary } from "../../../types/i18n";

export interface AssistantTexts {
  greeting: string;
  quick: string[];
  notConfigured: string;
  rateLimited: string;
  failed: string;
  close: string;
  open: string;
  dialog: string;
  title: string;
  writing: string;
  question: string;
  send: string;
}

export const ASSISTANT: Dictionary<AssistantTexts> = {
  uk: {
    greeting: "Вітаю! Допоможу обрати трафарет, розмір і матеріал або порахувати свій напис. Що плануєте прикрасити?",
    quick: ["Трафарет на торт з написом", "Що краще для штукатурки?", "Скільки коштує A4?", "Як швидко відправите?"],
    notConfigured: "Консультант ще вчиться. Напишіть нам у Viber або зателефонуйте, відповімо швидко.",
    rateLimited: "Забагато повідомлень підряд. Напишіть у Viber, менеджер продовжить розмову.",
    failed: "Не вдалося отримати відповідь. Спробуйте ще раз або напишіть у Viber.",
    close: "Закрити консультанта",
    open: "Запитати консультанта",
    dialog: "Консультант Trafaret Line",
    title: "Консультант",
    writing: "Пишу відповідь…",
    question: "Ваше питання",
    send: "Надіслати",
  },
  ru: {
    greeting: "Здравствуйте! Помогу выбрать трафарет, размер и материал или посчитать свою надпись. Что планируете украсить?",
    quick: ["Трафарет на торт с надписью", "Что лучше для штукатурки?", "Сколько стоит A4?", "Как быстро отправите?"],
    notConfigured: "Консультант ещё учится. Напишите нам в Viber или позвоните, ответим быстро.",
    rateLimited: "Слишком много сообщений подряд. Напишите в Viber, менеджер продолжит разговор.",
    failed: "Не удалось получить ответ. Попробуйте ещё раз или напишите в Viber.",
    close: "Закрыть консультанта",
    open: "Спросить консультанта",
    dialog: "Консультант Trafaret Line",
    title: "Консультант",
    writing: "Пишу ответ…",
    question: "Ваш вопрос",
    send: "Отправить",
  },  en: {
    greeting: "Hi! I can help you choose a stencil, size and material, or price your own text. What are you planning to decorate?",
    quick: ["Cake stencil with lettering", "What works best for plaster?", "How much is an A4?", "How fast do you ship?"],
    notConfigured: "Our assistant is still learning. Message us on Viber or give us a call, we reply quickly.",
    rateLimited: "Too many messages in a row. Message us on Viber and a manager will continue the conversation.",
    failed: "Could not get a reply. Please try again or message us on Viber.",
    close: "Close assistant",
    open: "Ask the assistant",
    dialog: "Trafaret Line assistant",
    title: "Assistant",
    writing: "Typing a reply…",
    question: "Your question",
    send: "Send",
  },
};
