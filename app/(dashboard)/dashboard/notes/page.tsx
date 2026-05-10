import { NotesPage } from "@/components/notes/notes-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "LifeOS – Ghi chú" };

export default function Notes() {
  return <NotesPage />;
}
