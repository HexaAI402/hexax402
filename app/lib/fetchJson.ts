export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 4500
): Promise<{ ok: true; data: T; ms: number } | { ok: false; error: string; ms: number }> {
  const t0 = performance.now();
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
    const ms = Math.round(performance.now() - t0);
    clearTimeout(id);

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status} ${res.statusText}${txt ? ` — ${txt.slice(0, 140)}` : ""}`, ms };
    }
    const data = (await res.json()) as T;
    return { ok: true, data, ms };
  } catch (e: any) {
    const ms = Math.round(performance.now() - t0);
    clearTimeout(id);
    const msg = e?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : (e?.message || "request failed");
    return { ok: false, error: msg, ms };
  }
}