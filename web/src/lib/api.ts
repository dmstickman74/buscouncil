export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getCsrfToken(): string {
  const match = document.cookie.match(/council_csrf=([^;]+)/);
  if (!match) return "";
  const val = decodeURIComponent(match[1]);
  const colon = val.indexOf(":");
  return colon > 0 ? val.substring(0, colon) : val;
}

export async function api<T>(
  path: string,
  opts?: RequestInit & { body?: string | FormData },
): Promise<T> {
  const headers: Record<string, string> = {};
  const method = opts?.method?.toUpperCase() ?? "GET";

  if (opts?.body && typeof opts.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  const res = await fetch(`/api${path}`, {
    credentials: "include",
    ...opts,
    headers: { ...headers, ...(opts?.headers as Record<string, string>) },
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data.detail) msg = data.detail;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, msg);
  }

  return res.json();
}
