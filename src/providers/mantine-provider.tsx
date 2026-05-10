"use client";

import { useEffect } from "react";
import { MantineProvider, createTheme, useMantineColorScheme } from "@mantine/core";
import { useUIStore } from "@/stores/ui-store";

const theme = createTheme({
  primaryColor: "violet",
  fontFamily: "var(--font-be-vietnam), 'Be Vietnam Pro', sans-serif",
  fontFamilyMonospace: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  defaultRadius: "md",
  components: {
    Button: { defaultProps: { radius: "md" } },
    TextInput: { defaultProps: { radius: "md" } },
    PasswordInput: { defaultProps: { radius: "md" } },
    Textarea: { defaultProps: { radius: "md" } },
    Select: { defaultProps: { radius: "md" } },
    Paper: { defaultProps: { radius: "xl" } },
    Card: { defaultProps: { radius: "xl" } },
    Modal: { defaultProps: { radius: "lg" } },
  },
});

/** Sync Mantine colorScheme từ zustand store */
function ColorSchemeSyncer() {
  const { colorScheme } = useUIStore();
  const { setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    setColorScheme(colorScheme);
  }, [colorScheme, setColorScheme]);

  return null;
}

export function MantineAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <ColorSchemeSyncer />
      {children}
    </MantineProvider>
  );
}
