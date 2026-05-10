/**
 * QueryClient singleton dùng chung.
 * Tách ra file riêng để có thể import ở cả Provider lẫn Server Components.
 */

import { QueryClient } from "@tanstack/react-query";

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Không refetch khi focus lại window (tùy chỉnh theo nhu cầu)
        refetchOnWindowFocus: false,
        // Retry 1 lần khi lỗi (trừ 4xx)
        retry: (failureCount, error: unknown) => {
          const status = (error as { response?: { status?: number } })?.response
            ?.status;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 1;
        },
        staleTime: 1000 * 60, // 1 phút
      },
      mutations: {
        retry: false,
      },
    },
  });

// Browser: singleton để tránh tạo nhiều instance
let browserQueryClient: QueryClient | undefined;

export const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: luôn tạo mới để tránh share state giữa các request
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
};
