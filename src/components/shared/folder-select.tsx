"use client";

import { Select } from "@mantine/core";
import { useFoldersIndex } from "@/api/folders";

interface FolderSelectProps {
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  placeholder?: string;
  size?: "xs" | "sm" | "md";
  clearable?: boolean;
}

/**
 * Dropdown chọn folder — dùng chung cho Notes và Snippets.
 * Flatten cây folder thành danh sách phẳng với indent để thể hiện cấp bậc.
 */
export function FolderSelect({
  value,
  onChange,
  label = "Thư mục",
  placeholder = "Không có thư mục",
  size = "sm",
  clearable = true,
}: FolderSelectProps) {
  const { data } = useFoldersIndex();
  const folders = data?.data ?? [];

  // Flatten tree → [{value, label, depth}]
  type FlatItem = { value: string; label: string };
  const flatItems: FlatItem[] = [];

  const flatten = (items: typeof folders, depth = 0) => {
    items
      .filter((f) => (depth === 0 ? f.parent_id === null : true))
      .forEach((f) => {
        const indent = "　".repeat(depth); // full-width space để indent
        flatItems.push({ value: String(f.id), label: `${indent}${f.icon ? f.icon + " " : ""}${f.name}` });
        if (f.children?.length) flatten(f.children, depth + 1);
      });
  };
  flatten(folders);

  return (
    <Select
      label={label}
      placeholder={placeholder}
      size={size}
      clearable={clearable}
      data={flatItems}
      value={value !== null ? String(value) : null}
      onChange={(v) => onChange(v !== null ? Number(v) : null)}
      searchable
    />
  );
}
