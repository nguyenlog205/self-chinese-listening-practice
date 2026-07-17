let basePromise = null;

export async function apiBase() {
  if (!basePromise) {
    basePromise = (async () => {
      if (typeof window !== "undefined" && window.listeningApp) {
        const port = await window.listeningApp.getBackendPort();
        return `http://127.0.0.1:${port}`;
      }
      // Not running inside the Electron shell (e.g. `vite dev` in a plain
      // browser) — fall back to a directly-reachable backend for local dev.
      return import.meta.env.VITE_LISTENING_API_BASE || "http://127.0.0.1:8000";
    })();
  }
  return basePromise;
}

export async function apiFetch(path, options) {
  const base = await apiBase();
  const res = await fetch(`${base}${path}`, options);
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function wsBase() {
  const base = await apiBase();
  return base.replace("http://", "ws://");
}
