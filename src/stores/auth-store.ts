import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authCookie } from "@/lib/auth-cookie";
import type { UserResource } from "@/api/auth/model";

interface AuthState {
  user: UserResource | null;
  isAuthenticated: boolean;

  setAuth: (user: UserResource, accessToken: string, refreshToken: string, expiresIn: number) => void;
  setUser: (user: UserResource) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken, expiresIn) => {
        authCookie.set(accessToken, expiresIn);
        authCookie.setRefresh(refreshToken);
        set({ user, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        authCookie.clear();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-user",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);

if (typeof window !== "undefined") {
  window.addEventListener("auth:logout", () => {
    useAuthStore.getState().logout();
  });
}

export const getAuthToken = (): string | undefined => authCookie.get();
