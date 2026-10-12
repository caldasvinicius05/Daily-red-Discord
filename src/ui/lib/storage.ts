/**
 * Browser storage can be missing or throw (private windows, Discord's iframe, blocked
 * site data), so every access is guarded and the app works without it.
 */
export function readJSON<T>(storage: "local" | "session", key: string): T | null {
  try {
    const raw = (storage === "local" ? window.localStorage : window.sessionStorage).getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(storage: "local" | "session", key: string, value: unknown): void {
  try {
    const target = storage === "local" ? window.localStorage : window.sessionStorage;
    if (value === null) target.removeItem(key);
    else target.setItem(key, JSON.stringify(value));
  } catch {
    // Not persisted; fine.
  }
}
