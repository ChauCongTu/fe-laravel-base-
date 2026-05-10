import { DashboardOverview } from "@/components/dashboard/overview";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "LifeOS – Tổng quan" };

export default function DashboardPage() {
  return <DashboardOverview />;
}
