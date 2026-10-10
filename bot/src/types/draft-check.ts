export interface DraftCheck {
  /** Без цього заявку не відправити. */
  blocking: string[]
  /** Конвеєр підбере сам за правилами каталогу, але краще вказати. */
  optional: string[]
}
