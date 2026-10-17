"use client";

// Return from Telegram's sign-in page: the login data is in the address (#tgAuthResult); it goes
// to /api/kabinet/telegram, which checks it with Medusa and sets the session cookie.

import { useEffect, useState } from "react";
import { useLocaleRouter } from "@/components/i18n/use-locale-router";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ACCOUNT } from "@/lib/i18n/dictionaries/account";
import { tr } from "@/lib/i18n/translate";
import { readTelegramResult } from "@/lib/account/read-telegram-result";

export function TelegramReturn() {
  const t = tr(ACCOUNT, useLocale());
  const router = useLocaleRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const data = readTelegramResult(window.location.hash);
    // Remove the login data from the address and the history.
    window.history.replaceState(null, "", window.location.pathname);
    if (!data) {
      router.replace("/kabinet");
      return;
    }
    fetch("/api/kabinet/telegram", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ data }) })
      .then(async (response) => {
        if (response.ok) return router.replace("/kabinet");
        const { error } = (await response.json().catch(() => ({}))) as { error?: string };
        router.replace(`/kabinet?pomylka=${error === "unavailable" ? "unavailable" : "telegram"}`);
      })
      .catch(() => setFailed(true));
  }, [router]);

  return <p role="status" className="m-0 text-lg">{failed ? t.telegramFailed : t.telegramSigningIn}</p>;
}
