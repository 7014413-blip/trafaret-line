import type { MedusaProductRef } from "../types/medusa"

/**
 * Публікація чернетки в Medusa v2 через Admin API секретним ключем
 * (Settings → Secret API Keys). Бот змінює лише статус товару draft → published.
 */

export class MedusaError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number | null,
  ) {
    super(message)
    this.name = "MedusaError"
  }
}

export class MedusaAdmin {
  constructor(
    private readonly baseUrl: string,
    private readonly secretKey: string,
    private readonly timeoutMs = 15_000,
  ) {}

  get enabled(): boolean {
    return this.secretKey.length > 0
  }

  private authHeader(): string {
    // Medusa v2: Basic-автентифікація, де «логін» = секретний ключ, пароль порожній.
    return `Basic ${Buffer.from(`${this.secretKey}:`).toString("base64")}`
  }

  private async request<T>(method: "GET" | "POST", pathAndQuery: string, body?: unknown): Promise<T> {
    if (!this.enabled) {
      throw new MedusaError("Не задано MEDUSA_ADMIN_API_KEY: публікація з бота вимкнена.", null)
    }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${pathAndQuery}`, {
        method,
        headers: {
          Authorization: this.authHeader(),
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (error) {
      const reason = (error as Error).name === "AbortError" ? "немає відповіді" : (error as Error).message
      throw new MedusaError(`Адмінка сайту недоступна (${this.baseUrl}): ${reason}. Сайт запущений?`, null)
    } finally {
      clearTimeout(timer)
    }
    const text = await response.text()
    if (!response.ok) {
      let detail = text.slice(0, 300)
      try {
        const parsed = JSON.parse(text) as { message?: string }
        if (parsed.message) detail = parsed.message
      } catch {
        // відповідь не JSON — лишаємо сирий текст
      }
      throw new MedusaError(`Medusa відповіла ${response.status}: ${detail}`, response.status)
    }
    return (text ? JSON.parse(text) : {}) as T
  }

  async findByHandle(handle: string): Promise<MedusaProductRef | null> {
    const query = new URLSearchParams({ handle, fields: "id,handle,status,title", limit: "1" })
    const data = await this.request<{ products?: MedusaProductRef[] }>("GET", `/admin/products?${query.toString()}`)
    const product = data.products?.find((p) => p.handle === handle)
    return product ?? null
  }

  /** Публікує товар за handle. Повертає оновлений товар; вже опублікований не чіпає. */
  async publishByHandle(handle: string): Promise<MedusaProductRef> {
    const product = await this.findByHandle(handle)
    if (!product) {
      throw new MedusaError(`Товар «${handle}» не знайдено в адмінці. Можливо, імпорт ще не виконано.`, 404)
    }
    if (product.status === "published") return product
    const data = await this.request<{ product: MedusaProductRef }>(
      "POST",
      `/admin/products/${encodeURIComponent(product.id)}`,
      { status: "published" },
    )
    return data.product
  }

  /** Посилання на товар в адмінці Medusa для кнопки «Відкрити в адмінці». */
  adminUrl(productId: string): string {
    return `${this.baseUrl}/app/products/${encodeURIComponent(productId)}`
  }
}
