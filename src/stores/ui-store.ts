/**
 * UI store — lưu preferences: colorScheme, sidebar state, v.v.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  colorScheme: "light" | "dark" | "auto";
  setColorScheme: (scheme: "light" | "dark" | "auto") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      colorScheme: "light",
      setColorScheme: (colorScheme) => set({ colorScheme }),
    }),
    { name: "ui-storage" }
  )
);
