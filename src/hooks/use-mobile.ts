/**
 * Hook detect mobile breakpoint.
 * Dùng Mantine's useMediaQuery để đồng bộ với Mantine breakpoints.
 */
import { useMediaQuery } from "@mantine/hooks";

export function useIsMobile() {
  // sm = 48em = 768px (Mantine default)
  return useMediaQuery("(max-width: 768px)") ?? false;
}

export function useIsTablet() {
  return useMediaQuery("(max-width: 1024px)") ?? false;
}
