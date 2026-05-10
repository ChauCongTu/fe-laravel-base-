/**
 * Zustand store quản lý trạng thái auth.
 * - Lưu user và token
 * - Persist token vào localStorage
 * - _hasHydrated: tránh flash màn hình login khi SSR chưa hydrate xong
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserResource } from "@/api/auth/model";

interface AuthState {
  user: UserResource | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  setAuth: (user: UserResource, token: string) => void;
  setUser: (user: UserResource) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", token);
        }
        set({ user, token, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          if (state.token && typeof window !== "undefined") {
            localStorage.setItem("auth_token", state.token);
          }
        } else {
          useAuthStore.getState().setHasHydrated(true);
        }
      },
    }
  )
);

// Lắng nghe event "auth:logout" từ axios interceptor (tránh circular import)
if (typeof window !== "undefined") {
  window.addEventListener("auth:logout", () => {
    useAuthStore.getState().logout();
  });
}
