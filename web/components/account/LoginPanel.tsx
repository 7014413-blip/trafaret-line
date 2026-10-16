// Sign-in of the cabinet: Google and Telegram buttons (each only when its key is set), no
// passwords and no SMS (ТЗ §4.9). Both go to the provider's own page and come back signed in.

import type { LoginProviders } from "@/types/account";
import { telegramAuthUrl } from "@/lib/account/telegram-auth-url";

const BUTTON = "flex h-12 items-center justify-center gap-2.5 rounded-full border-[1.5px] border-[var(--ink)] bg-[var(--card)] px-6 font-bold hover:bg-[var(--surface)]";

export function LoginPanel({ providers, siteUrl, error }: { providers: LoginProviders; siteUrl: string; error: string | null }) {
  const any = providers.google || !!providers.telegramBotId;
  return (
    <section aria-labelledby="login-title" className="grid max-w-[460px] gap-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6">
      <h1 id="login-title" className="m-0 font-[family-name:var(--font-display)] text-2xl font-bold">Вхід у кабінет</h1>
      <p className="m-0 text-[var(--muted)]">Ваші замовлення, їх статус і номер ТТН. Будь-яке замовлення можна повторити в один клік.</p>
      {error && <p role="alert" className="m-0 rounded-xl bg-[var(--surface)] px-4 py-3 font-semibold">{error}</p>}
      {any ? (
        <div className="grid gap-3">
          {providers.google && (
            <form action="/api/kabinet/google/start" method="get" className="grid">
              <button type="submit" className={BUTTON}>
                <span aria-hidden className="font-[family-name:var(--font-display)] text-lg">G</span> Увійти через Google
              </button>
            </form>
          )}
          {providers.telegramBotId && (
            <a href={telegramAuthUrl(providers.telegramBotId, siteUrl)} className={BUTTON}>
              <span aria-hidden>✈</span> Увійти через Telegram
            </a>
          )}
          <p className="m-0 text-[13px] text-[var(--muted)]">Без пароля і SMS. Замовити можна і без кабінету.</p>
        </div>
      ) : (
        <p className="m-0">Вхід у кабінет скоро запрацює. Поки що статус замовлення підкажемо у Viber або Telegram.</p>
      )}
    </section>
  );
}
