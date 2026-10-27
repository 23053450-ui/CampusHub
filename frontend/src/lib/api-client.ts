import { supabase } from "@/lib/supabase";
import type { Result, AppError, AppErrorCode } from "@/shared/result";

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

function mapHttpError(status: number, errorPayload?: any): AppError {
  let code: AppErrorCode = "INTERNAL";

  if (errorPayload?.error?.code) {
    code = errorPayload.error.code as AppErrorCode;
    return {
      code,
      message: errorPayload.error.message || "An error occurred",
      details: errorPayload.error.details,
    };
  }

  switch (status) {
    case 401:
      code = "UNAUTHENTICATED";
      break;
    case 403:
      code = "FORBIDDEN";
      break;
    case 404:
      code = "NOT_FOUND";
      break;
    case 422:
      code = "VALIDATION";
      break;
    case 429:
      code = "RATE_LIMITED";
      break;
    case 500:
    default:
      code = "INTERNAL";
      break;
  }

  return {
    code,
    message: errorPayload?.detail || errorPayload?.message || `Request failed with status ${status}`,
    details: errorPayload,
  };
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("UNAUTHENTICATED: Active Supabase session required to access backend services.");
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

export async function apiGet<T>(path: string): Promise<Result<T>> {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: "GET",
      headers: {
        ...authHeaders,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: mapHttpError(res.status, err) };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    if (err?.message?.includes("UNAUTHENTICATED")) {
      return {
        data: null,
        error: { code: "UNAUTHENTICATED", message: err.message, details: err },
      };
    }
    return {
      data: null,
      error: { code: "NETWORK", message: err?.message || "Network connection failed", details: err },
    };
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<Result<T>> {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: mapHttpError(res.status, err) };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    if (err?.message?.includes("UNAUTHENTICATED")) {
      return {
        data: null,
        error: { code: "UNAUTHENTICATED", message: err.message, details: err },
      };
    }
    return {
      data: null,
      error: { code: "NETWORK", message: err?.message || "Network connection failed", details: err },
    };
  }
}

export async function apiPostForm<T>(path: string, formData: FormData): Promise<Result<T>> {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: {
        ...authHeaders,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: mapHttpError(res.status, err) };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    if (err?.message?.includes("UNAUTHENTICATED")) {
      return {
        data: null,
        error: { code: "UNAUTHENTICATED", message: err.message, details: err },
      };
    }
    return {
      data: null,
      error: { code: "NETWORK", message: err?.message || "Network connection failed", details: err },
    };
  }
}
