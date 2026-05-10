"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Center, Loader, Stack, Text } from "@mantine/core";
import { useAuthStore } from "@/stores/auth-store";
import { authCookie } from "@/lib/auth-cookie";
import { authRefresh } from "@/api/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setAuth, logout } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Đợi Zustand persist rehydrate xong (load user từ localStorage)
    // rồi mới kiểm tra token
    const init = () => {
      const accessToken = authCookie.get();
      const refreshToken = authCookie.getRefresh();

      if (accessToken) {
        // Có access token → đồng bộ isAuthenticated nếu cần
        const { user } = useAuthStore.getState();
        if (user) {
          useAuthStore.setState({ isAuthenticated: true });
        }
        setReady(true);
        return;
      }

      if (refreshToken) {
        // Access token hết hạn nhưng còn refresh token → tự refresh
        authRefresh({ refresh_token: refreshToken })
          .then((res) => {
            setAuth(res.data, res.access_token, res.refresh_token, res.expires_in);
            setReady(true);
          })
          .catch(() => {
            logout();
            router.replace("/login");
          });
        return;
      }

      // Không có token nào → redirect login
      router.replace("/login");
    };

    // Nếu persist đã hydrate xong → chạy ngay
    if (useAuthStore.persist.hasHydrated()) {
      init();
    } else {
      // Chưa hydrate → đợi
      const unsub = useAuthStore.persist.onFinishHydration(init);
      return unsub;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync isAuthenticated khi axios interceptor refresh token thành công
  useEffect(() => {
    const handler = () => {
      const { user } = useAuthStore.getState();
      if (user) useAuthStore.setState({ isAuthenticated: true });
    };
    window.addEventListener("auth:refreshed", handler);
    return () => window.removeEventListener("auth:refreshed", handler);
  }, []);

  if (!ready) {
    return (
      <Center style={{ minHeight: "100vh" }}>
        <Stack align="center" gap="sm">
          <Loader color="violet" size="md" />
          <Text size="sm" c="dimmed">Đang tải...</Text>
        </Stack>
      </Center>
    );
  }

  return <>{children}</>;
}
