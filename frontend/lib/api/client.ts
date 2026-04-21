import type { ApiError } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/* ── 토큰 관리 ── */
let _authToken = "";
let _refreshToken = "";
let _isRefreshing = false;
let _refreshQueue: Array<(newToken: string) => void> = [];

/** 토큰 갱신 완료 시 Zustand store 에 저장하기 위한 콜백 */
let _onTokensRefreshed: ((access: string, refresh: string) => void) | null =
  null;

export function setAuthToken(token: string) {
  _authToken = token;
}

export function getAuthToken() {
  return _authToken;
}

export function setRefreshToken(token: string) {
  _refreshToken = token;
}

export function setOnTokensRefreshed(
  cb: (access: string, refresh: string) => void,
) {
  _onTokensRefreshed = cb;
}

/* ── 에러 클래스 ── */
class HttpError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
    this.name = "HttpError";
  }
}

/* ── 토큰 자동 갱신 ── */
async function tryRefreshToken(): Promise<string> {
  if (!_refreshToken) throw new Error("리프레시 토큰이 없습니다.");

  if (_isRefreshing) {
    // 이미 갱신 중이면 완료 대기
    return new Promise((resolve) => {
      _refreshQueue.push(resolve);
    });
  }

  _isRefreshing = true;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: _refreshToken }),
    });

    if (!res.ok) throw new Error("토큰 갱신 실패");

    const json = await res.json();
    const newAccess: string = json.data?.access_token ?? json.access_token;
    const newRefresh: string =
      json.data?.refresh_token ?? json.refresh_token ?? _refreshToken;

    _authToken = newAccess;
    _refreshToken = newRefresh;
    _onTokensRefreshed?.(newAccess, newRefresh);

    // 대기 중인 요청들 재개
    _refreshQueue.forEach((resolve) => resolve(newAccess));
    _refreshQueue = [];

    return newAccess;
  } catch (err) {
    _refreshQueue = [];
    throw err;
  } finally {
    _isRefreshing = false;
  }
}

/* ── 공통 fetch ── */
async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(_authToken ? { Authorization: `Bearer ${_authToken}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  /* 401 → 토큰 갱신 후 1회 재시도 */
  if (res.status === 401 && retry && _refreshToken) {
    try {
      const newToken = await tryRefreshToken();
      return request<T>(
        path,
        {
          ...options,
          headers: {
            ...(options.headers as Record<string, string>),
            Authorization: `Bearer ${newToken}`,
          },
        },
        false, // 재시도는 1회만
      );
    } catch {
      // 갱신 실패 → 원래 에러로 처리
    }
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.message ?? body.detail ?? message;
    } catch {
      // 응답 본문 파싱 실패 시 기본 메시지 사용
    }
    throw new HttpError({ status: res.status, message });
  }

  return res.json() as Promise<T>;
}

/**
 * multipart/form-data 등 Content-Type 을 직접 설정하면 안 되는 요청에서 사용.
 * 401 발생 시 토큰을 갱신하고 1회 재시도합니다.
 */
export async function fetchWithAuth(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<Response> {
  const url = `${BASE_URL}${path}`;
  const token = _authToken;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && retry && _refreshToken) {
    try {
      const newToken = await tryRefreshToken();
      return fetchWithAuth(
        path,
        {
          ...options,
          headers: {
            ...(options.headers as Record<string, string>),
            Authorization: `Bearer ${newToken}`,
          },
        },
        false,
      );
    } catch {
      // 갱신 실패 → 원래 응답 반환
    }
  }

  return res;
}

export const client = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    }),

  put: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    }),
};

export { HttpError };
