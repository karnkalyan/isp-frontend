import toast from "react-hot-toast";

/**
 * Dynamically resolves the API base URL based on the current browser domain.
 * This allows one build to work on multiple domains.
 */
function getDynamicBaseUrl(): string {
  if (typeof window === "undefined") {
    // Server-side (Middleware/SSR) fallback
    return process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.radius.kisan.net.np";
  }

  const hostname = window.location.hostname;

  // Check which root domain the user is on
  if (hostname.includes("namaste.net.np")) {
    return "https://api.radius.namaste.net.np";
  }

  if (hostname.includes("arrownet.com.np")) {
    return "https://api.cms.arrownet.com.np";
  }

  if (hostname.includes("kisan.net.np")) {
    return "https://api.radius.kisan.net.np";
  }

  if (hostname.includes("192.168.200.11")) {
    return "http://192.168.200.11:3200";
  }

  if (hostname.includes("192.168.10.3")) {
    return "http://192.168.10.3:3200";
  }

  // Local development fallback
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3200";
}

/**
 * Get WebSocket URL based on current domain
 */
export function getWebSocketUrl(): string {
  const baseUrl = getDynamicBaseUrl();
  const url = new URL(baseUrl);
  // Change the protocol to ws or wss
  url.protocol = url.protocol.replace('http', 'ws');
  // Change the path to /ws
  url.pathname = '/ws';
  return url.toString();
}

function isClient() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

async function parseResponsePayload(res: Response) {
  try {
    return await res.clone().json();
  } catch {
    try {
      return await res.clone().text();
    } catch {
      return null;
    }
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get the URL dynamically for every request
  const BASE_URL = getDynamicBaseUrl();
  const url = `${BASE_URL}${endpoint}`;

  options.credentials = "include";

  if (!(options.body instanceof FormData)) {
    options.headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
  } else {
    const newHeaders = { ...(options.headers || {}) } as Record<string, any>;
    delete newHeaders["Content-Type"];
    options.headers = newHeaders;
  }

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (err: any) {
    const msg = err?.message || "Network error";
    if (isClient()) toast.error(msg);
    throw new Error(msg);
  }

  // 401 refresh flow
  if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (refreshRes.ok) {
        // Retry the original request
        response = await fetch(url, options);
      } else {
        const payload = await parseResponsePayload(refreshRes);
        const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
        if (isClient()) {
          toast.error("Session expired. Please login again.");
          window.location.href = "/login";
        }
        throw new Error(payloadStr || "Session expired");
      }
    } catch (err: any) {
      const msg = err?.message || "Session refresh failed";
      throw new Error(msg);
    }
  }

  // Handle errors
  if (!response.ok) {
    const payload = await parseResponsePayload(response);
    let payloadStr: string;

    if (payload && typeof payload === "object" && "error" in payload) {
      payloadStr = String((payload as any).error);
    } else if (typeof payload === "string") {
      payloadStr = payload;
    } else {
      payloadStr = `${response.status} ${response.statusText}`;
    }

    if (isClient()) toast.error(payloadStr);
    throw new Error(payloadStr);
  }

  // Success parsing
  if (response.status === 204 || response.status === 205) return (null as unknown) as T;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}