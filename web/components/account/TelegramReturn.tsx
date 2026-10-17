"use client";

// Return from Telegram's sign-in page: the login data is in the address (#tgAuthResult); it goes
// to /api/kabinet/telegram, which checks it with Medusa and sets the session cookie.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readTelegramResult } from "@/lib/account/read-telegram-result";

export function TelegramReturn() {
  const router = useRouter();
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

  return <p role="status" className="m-0 text-lg">{failed ? "Немає звʼязку. Оновіть сторінку." : "Входимо через Telegram…"}</p>;
}
