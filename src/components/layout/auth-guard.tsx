"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Center, Loader, Stack, Text } from "@mantine/core";
import { useAuthStore } from "@/stores/auth-store";

/**
 * AuthGuard — bảo vệ các trang dashboard.
 * Chờ hydrate xong, nếu không có token → redirect /login.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (hasHydrated && !token) {
      router.replace("/login");
    }
  }, [hasHydrated, token, router]);

  if (!hasHydrated) {
    return (
      <Center className="min-h-screen">
        <Stack align="center" gap="sm">
          <Loader color="violet" size="md" />
          <Text size="sm" c="dimmed">Đang tải...</Text>
        </Stack>
      </Center>
    );
  }

  if (!token) return null;

  return <>{children}</>;
}
