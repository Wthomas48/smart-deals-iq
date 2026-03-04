import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiBaseUrl } from "./api-config";

/**
 * Gets the base URL for the Express API server (e.g., "http://localhost:5000")
 * Uses the centralized platform-aware API configuration.
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  const apiUrl = getApiBaseUrl();
  // Ensure trailing slash is removed for consistent URL joining
  return apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clone the response to avoid consuming the body
    const clonedRes = res.clone();
    let text = res.statusText;
    try {
      text = (await clonedRes.text()) || res.statusText;
    } catch {
      // Silently fail if body can't be read
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
