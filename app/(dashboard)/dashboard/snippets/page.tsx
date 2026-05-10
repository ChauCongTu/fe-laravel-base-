import { SnippetsPage } from "@/components/snippets/snippets-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "LifeOS – Snippets" };

export default function Snippets() {
  return <SnippetsPage />;
}
