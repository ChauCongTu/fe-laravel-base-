/**
 * useAutosave — debounce + gọi save callback sau khi user ngừng gõ.
 * Trả về: { isSaving, lastSaved, isDirty }
 */
import { useEffect, useRef, useState, useCallback } from "react";

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void> | void;
  delay?: number;          // ms debounce, default 1500
  enabled?: boolean;       // tắt khi chưa có id (draft mới chưa tạo)
}

export function useAutosave<T>({
  data,
  onSave,
  delay = 1500,
  enabled = true,
}: UseAutosaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const savedDataRef = useRef<T>(data);

  const save = useCallback(
    async (d: T) => {
      setIsSaving(true);
      try {
        await onSave(d);
        savedDataRef.current = d;
        setLastSaved(new Date());
        setIsDirty(false);
      } finally {
        setIsSaving(false);
      }
    },
    [onSave]
  );

  useEffect(() => {
    // Bỏ qua lần render đầu tiên
    if (isFirstRender.current) {
      isFirstRender.current = false;
      savedDataRef.current = data;
      return;
    }

    if (!enabled) return;

    // Kiểm tra có thay đổi thực sự không
    if (JSON.stringify(data) === JSON.stringify(savedDataRef.current)) return;

    setIsDirty(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      save(data);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, delay, enabled, save]);

  return { isSaving, lastSaved, isDirty };
}
