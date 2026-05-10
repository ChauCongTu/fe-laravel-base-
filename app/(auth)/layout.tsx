import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LifeOS – Đăng nhập",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 px-4 py-12">
      {children}
    </div>
  );
}
