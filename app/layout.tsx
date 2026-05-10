import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { ColorSchemeScript } from "@mantine/core";
import { QueryProvider } from "@/providers/query-provider";
import { MantineAppProvider } from "@/providers/mantine-provider";
import "@mantine/core/styles.css";
import "./globals.css";

/**
 * Be Vietnam Pro — font Google hỗ trợ tiếng Việt đầy đủ dấu thanh.
 * Bao gồm các weight thường dùng.
 */
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LifeOS",
  description: "Your personal life operating system",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LifeOS",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} h-full antialiased`}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className="min-h-full flex flex-col">
        <MantineAppProvider>
          <QueryProvider>{children}</QueryProvider>
        </MantineAppProvider>
      </body>
    </html>
  );
}
