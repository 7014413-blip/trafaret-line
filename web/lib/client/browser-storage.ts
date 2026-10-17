// localStorage / sessionStorage that never throws: private mode, blocked cookies or a full
// quota make the browser refuse, and analytics must never break the page because of it.

type Area = "local" | "session";

function area(name: Area): Storage | null {
  try {
    return name === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStored(name: Area, key: string): string | null {
  try {
    return area(name)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStored(name: Area, key: string, value: string | null): void {
  try {
    const storage = area(name);
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // Nothing to do: the value simply is not kept.
  }
}
