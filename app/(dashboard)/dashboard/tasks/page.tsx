import { TasksPage } from "@/components/tasks/tasks-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "LifeOS – Công việc" };

export default function Tasks() {
  return <TasksPage />;
}
