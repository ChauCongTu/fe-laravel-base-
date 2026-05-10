import Cookies from "js-cookie";

const ACCESS_KEY = "auth_token";
const REFRESH_KEY = "auth_refresh_token";

const BASE_OPTIONS: Cookies.CookieAttributes = {
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const authCookie = {
  // ── Access token ──────────────────────────────────────────────────────────
  get: (): string | undefined => {
    if (typeof window === "undefined") return undefined;
    return Cookies.get(ACCESS_KEY);
  },
  set: (token: string, expiresInSeconds?: number): void => {
    if (typeof window === "undefined") return;
    const expires = expiresInSeconds
      ? new Date(Date.now() + expiresInSeconds * 1000)
      : 1; // 1 ngày fallback
    Cookies.set(ACCESS_KEY, token, { ...BASE_OPTIONS, expires });
  },
  remove: (): void => {
    if (typeof window === "undefined") return;
    Cookies.remove(ACCESS_KEY, { path: "/" });
  },

  // ── Refresh token ─────────────────────────────────────────────────────────
  getRefresh: (): string | undefined => {
    if (typeof window === "undefined") return undefined;
    return Cookies.get(REFRESH_KEY);
  },
  setRefresh: (token: string): void => {
    if (typeof window === "undefined") return;
    // Refresh token sống 30 ngày
    Cookies.set(REFRESH_KEY, token, { ...BASE_OPTIONS, expires: 30 });
  },
  removeRefresh: (): void => {
    if (typeof window === "undefined") return;
    Cookies.remove(REFRESH_KEY, { path: "/" });
  },

  // ── Xóa cả hai ───────────────────────────────────────────────────────────
  clear: (): void => {
    authCookie.remove();
    authCookie.removeRefresh();
  },
};
