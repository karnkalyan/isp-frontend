// lib/api.ts
import toast from "react-hot-toast";

/**
 * Dynamically resolves the API base URL based on the current browser domain.
 * This allows one build to work on multiple domains.
 */
export function getDynamicBaseUrl(): string {
  if (typeof window === "undefined") {
    // Server-side (Middleware/SSR) fallback
    return process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3200";
  }

  const hostname = window.location.hostname;

  const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configuredBase) return configuredBase;

  // Same-origin production path: https://frontend-domain/api
  if (hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.startsWith("192.168.")) {
    return "/api";
  }

  // Local development fallback: use the exact same hostname the user is visiting
  return `http://${hostname}:3200`;
}

/**
 * Get WebSocket URL based on current domain
 */
export function getWebSocketUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const baseUrl = getDynamicBaseUrl();
  if (baseUrl.startsWith("/")) {
    return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;
  }
  try {
    const url = new URL(baseUrl);
    // Change the protocol to ws or wss
    url.protocol = url.protocol.replace("http", "ws");
    // Change the path to /ws
    url.pathname = "/ws";
    return url.toString();
  } catch {
    const hostname = window.location.hostname;
    return `ws://${hostname}:3200/ws`;
  }
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

// Global state for token refresh mutex
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get the URL dynamically for every request
  const BASE_URL = getDynamicBaseUrl().replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  options.credentials = "include";

  const selectedBranchId = isClient() ? localStorage.getItem("selected-branch-id") : null;

  if (!(options.body instanceof FormData)) {
    options.headers = {
      "Content-Type": "application/json",
      ...(selectedBranchId ? { "x-selected-branch-id": selectedBranchId } : {}),
      ...(options.headers || {}),
    };
  } else {
    const newHeaders = { 
      ...(selectedBranchId ? { "x-selected-branch-id": selectedBranchId } : {}),
      ...(options.headers || {}) 
    } as Record<string, any>;
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
  if (response.status === 401 && !endpoint.includes("/auth/refresh") && !endpoint.includes("/auth/login")) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }).then(async (refreshRes) => {
        if (!refreshRes.ok) {
           if (isClient() && window.location.pathname !== "/login") {
              toast.error("Session expired. Please login again.");
              window.location.href = "/login";
           }
           return false;
        }
        try {
          // Simply succeed, cookies are updated automatically by backend response
          await refreshRes.json();
        } catch (e) {
          console.error("Failed to parse refresh token response:", e);
        }
        return true;
      }).catch(() => false)
        .finally(() => {
          isRefreshing = false;
        });
    }

    const refreshSuccess = await refreshPromise;
    
    if (refreshSuccess) {
      // Retry the original request
      response = await fetch(url, options);
    } else {
      throw new Error("Session expired");
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
  if (response.status === 204 || response.status === 205)
    return null as unknown as T;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}
