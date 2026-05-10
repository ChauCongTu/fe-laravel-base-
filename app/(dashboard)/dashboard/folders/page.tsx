import { FoldersPage } from "@/components/folders/folders-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "LifeOS – Thư mục" };

export default function Folders() {
  return <FoldersPage />;
}
