/**
 * Axios instance dùng chung cho toàn bộ API.
 *
 * Tính năng:
 * - Tự động đính kèm Bearer token từ localStorage (hoặc cookie)
 * - Hỗ trợ upload file (multipart/form-data) — axios tự detect khi body là FormData
 * - Xử lý lỗi 401 → redirect về trang login
 * - Base URL lấy từ biến môi trường NEXT_PUBLIC_API_URL
 */

import Axios, { AxiosError, AxiosRequestConfig } from "axios";

export const axiosClient = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://lifeos.test/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Request interceptor: đính kèm Bearer token ────────────────────────────
axiosClient.interceptors.request.use((config) => {
  // Lấy token từ localStorage (client-side only)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Nếu body là FormData, xóa Content-Type để axios tự set boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

// ── Response interceptor: xử lý lỗi toàn cục ─────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      // Dispatch custom event để auth store lắng nghe — tránh circular import
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
    return Promise.reject(error);
  }
);

/**
 * Hàm mutator mà orval sẽ gọi thay vì axios mặc định.
 * Signature này khớp với cấu hình `override.mutator` trong orval.config.ts.
 */
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

  // Cho phép react-query cancel request khi component unmount
  // @ts-expect-error — thuộc tính cancel không có trong Promise chuẩn
  promise.cancel = () => {
    source.cancel("Query was cancelled by React Query");
  };

  return promise;
};

export type ErrorType<Error> = AxiosError<Error>;

/**
 * Helper lưu token sau khi login / register thành công.
 */
export const saveAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
};

/**
 * Helper xóa token khi logout.
 */
export const clearAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
};
