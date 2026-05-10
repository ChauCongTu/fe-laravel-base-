import { ProfilePage } from "@/components/dashboard/profile-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "LifeOS – Hồ sơ" };

export default function Profile() {
  return <ProfilePage />;
}
