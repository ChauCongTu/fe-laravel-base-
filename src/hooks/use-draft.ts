/**
 * useDraft — lưu draft vào localStorage để không mất khi reload.
 */
import { useEffect, useState } from "react";

export function useDraft<T>(key: string, initial: T) {
  const storageKey = `draft:${key}`;

  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  }, [storageKey, value]);

  const clearDraft = () => {
    localStorage.removeItem(storageKey);
    setValue(initial);
  };

  return [value, setValue, clearDraft] as const;
}
