// JSON call of an admin page to the admin API: same address and session cookie as the admin
// itself; an error answer becomes an Error with the server's message.

export async function adminJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", headers: { accept: "application/json", "content-type": "application/json" }, ...init })
  const data = (await response.json().catch(() => ({}))) as T & { message?: string }
  if (!response.ok) throw new Error(data.message || `Помилка сервера (${response.status})`)
  return data
}
