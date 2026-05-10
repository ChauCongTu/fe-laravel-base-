import Axios, { AxiosError, AxiosRequestConfig } from "axios";
import { authCookie } from "@/lib/auth-cookie";

export const axiosClient = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://lifeos.test/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Request: đính kèm access token ───────────────────────────────────────
axiosClient.interceptors.request.use((config) => {
  const token = authCookie.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) delete config.headers["Content-Type"];
  return config;
});

// ── Response: tự động refresh khi access token hết hạn ───────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Chỉ xử lý 401, không retry chính endpoint refresh (tránh loop)
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh") &&
      !original.url?.includes("/auth/login")
    ) {
      const refreshToken = authCookie.getRefresh();

      if (!refreshToken) {
        // Không có refresh token → logout hẳn
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Đang refresh → xếp hàng chờ
        return new Promise((resolve) => {
          refreshQueue.push((newToken) => {
            original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
            resolve(axiosClient(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const res = await axiosClient.post<{
          access_token: string;
          refresh_token: string;
          expires_in: number;
          data: unknown;
        }>("/v1/auth/refresh", { refresh_token: refreshToken });

        const { access_token, refresh_token, expires_in } = res.data;

        authCookie.set(access_token, expires_in);
        authCookie.setRefresh(refresh_token);

        // Cập nhật isAuthenticated trong store (không import store trực tiếp — tránh circular)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:refreshed", { detail: { access_token } }));
        }

        processQueue(access_token);

        original.headers = { ...original.headers, Authorization: `Bearer ${access_token}` };
        return axiosClient(original);
      } catch {
        // Refresh thất bại → logout
        refreshQueue = [];
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const axiosInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = axiosClient<T>({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error — cancel không có trong Promise chuẩn
  promise.cancel = () => source.cancel("Query was cancelled by React Query");
  return promise;
};

export type ErrorType<Error> = AxiosError<Error>;
