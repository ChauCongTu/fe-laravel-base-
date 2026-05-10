"use client";

import { useState, useCallback } from "react";
import {
  Text, Badge, Group, Stack, TextInput, Button, Select,
  Skeleton, ActionIcon, Tooltip, useMantineColorScheme,
} from "@mantine/core";
import {
  IconCode, IconPlus, IconTrash, IconX, IconSearch,
  IconCopy, IconCheck, IconDeviceFloppy, IconArrowLeft,
} from "@tabler/icons-react";
import {
  useSnippetsIndex, useSnippetsStore, useSnippetsUpdate, useSnippetsDestroy,
  getSnippetsIndexQueryKey,
} from "@/api/snippets";
import { useQueryClient } from "@tanstack/react-query";
import { useAutosave } from "@/hooks/use-autosave";
import { useDraft } from "@/hooks/use-draft";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import type { SnippetResource } from "@/api/snippets/model";

const LANGUAGES = [
  "javascript", "typescript", "python", "java", "go", "rust",
  "php", "ruby", "swift", "kotlin", "css", "html", "sql",
  "bash", "json", "yaml", "markdown", "other",
].map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }));

const langColor: Record<string, string> = {
  javascript: "yellow", typescript: "blue", python: "teal",
  java: "orange", go: "cyan", rust: "red", php: "violet",
  css: "pink", html: "orange", sql: "grape",
};

interface EditorState {
  title: string;
  code_block: string;
  language: string;
  description: string;
}

const EMPTY: EditorState = { title: "", code_block: "", language: "javascript", description: "" };

export function SnippetsPage() {
  const qc = useQueryClient();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const isMobile = useIsMobile();

  const [selected, setSelected] = useState<SnippetResource | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");

  const [draft, setDraft, clearDraft] = useDraft<EditorState>("new-snippet", EMPTY);
  const [editorState, setEditorState] = useState<EditorState>(EMPTY);

  const { data, isLoading } = useSnippetsIndex();
  const snippets = (data?.data ?? []).filter((s) =>
    search === "" ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.language.toLowerCase().includes(search.toLowerCase())
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: getSnippetsIndexQueryKey() });

  const { mutate: createSnippet, isPending: creating } = useSnippetsStore({
    mutation: {
      onSuccess: (created) => {
        invalidate(); clearDraft(); setIsCreating(false);
        setSelected(created.data);
        setEditorState({ title: created.data.title, code_block: created.data.code_block, language: created.data.language, description: created.data.description ?? "" });
        setSaveStatus("saved");
        if (isMobile) setMobileView("editor");
      },
    },
  });

  const { mutate: updateSnippet } = useSnippetsUpdate({
    mutation: { onSuccess: () => { invalidate(); setSaveStatus("saved"); } },
  });

  const { mutate: deleteSnippet, isPending: deleting } = useSnippetsDestroy({
    mutation: {
      onSuccess: () => {
        invalidate(); setDeleteTarget(null);
        if (selected?.id === deleteTarget) {
          setSelected(null); setIsCreating(false);
          if (isMobile) setMobileView("list");
        }
      },
    },
  });

  const handleAutosave = useCallback(async (state: EditorState) => {
    if (!selected) return;
    setSaveStatus("saving");
    updateSnippet({ snippet: selected.id, data: { title: state.title || "Snippet", code_block: state.code_block, language: state.language, description: state.description || null } });
  }, [selected, updateSnippet]);

  const { isDirty } = useAutosave({ data: editorState, onSave: handleAutosave, delay: 1500, enabled: !!selected && !isCreating });

  const openNote = (s: SnippetResource) => {
    setIsCreating(false); setSelected(s);
    setEditorState({ title: s.title, code_block: s.code_block, language: s.language, description: s.description ?? "" });
    setSaveStatus("");
    if (isMobile) setMobileView("editor");
  };

  const saveNew = () => {
    if (!draft.code_block.trim()) return;
    createSnippet({ data: { title: draft.title || "Snippet", code_block: draft.code_block, language: draft.language, description: draft.description || null } });
  };

  const copyCode = () => {
    const code = isCreating ? draft.code_block : editorState.code_block;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const current = isCreating ? draft : editorState;
  const setCurrent = isCreating
    ? (v: EditorState | ((p: EditorState) => EditorState)) => setDraft(typeof v === "function" ? v(draft) : v)
    : (v: EditorState | ((p: EditorState) => EditorState)) => setEditorState(typeof v === "function" ? v(editorState) : v);

  const panelBg = isDark ? "var(--mantine-color-dark-7)" : "white";
  const listBg = isDark ? "var(--mantine-color-dark-8)" : "#f8f8f8";
  const editorBg = "#1e1e2e";
  const borderColor = isDark ? "var(--mantine-color-dark-5)" : "#e5e7eb";
  const activeItemBg = isDark ? "var(--mantine-color-dark-5)" : "#ede9fe";
  const hoverBg = isDark ? "var(--mantine-color-dark-6)" : "#f3f4f6";
  const containerH = isMobile ? "calc(100dvh - 56px - 16px)" : "calc(100vh - 56px - 32px)";

  // ── List panel ────────────────────────────────────────────────────────────
  const ListPanel = (
    <div style={{ width: isMobile ? "100%" : 240, minWidth: isMobile ? undefined : 200, background: listBg, borderRight: isMobile ? "none" : `1px solid ${borderColor}`, display: "flex", flexDirection: "column", flexShrink: 0, height: "100%" }}>
      <div style={{ padding: "12px 12px 8px", borderBottom: `1px solid ${borderColor}` }}>
        <Group justify="space-between" mb={8}>
          <Text fw={600} size="sm">Snippets</Text>
          <ActionIcon size="sm" variant="filled" color="violet" onClick={() => { setSelected(null); setIsCreating(true); if (isMobile) setMobileView("editor"); }}>
            <IconPlus size={14} />
          </ActionIcon>
        </Group>
        <TextInput size="xs" placeholder="Tìm kiếm..." leftSection={<IconSearch size={13} />}
          value={search} onChange={(e) => setSearch(e.currentTarget.value)}
          styles={{ input: { background: "transparent" } }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {isCreating && !isMobile && (
          <div style={{ padding: "10px 12px", background: activeItemBg, borderLeft: "3px solid var(--mantine-color-violet-5)" }}>
            <Text size="xs" fw={600} c="violet" lineClamp={1}>{draft.title || "Snippet mới..."}</Text>
            <Badge size="xs" variant="light" color={langColor[draft.language] ?? "gray"} mt={4}>{draft.language}</Badge>
          </div>
        )}

        {isLoading
          ? [1, 2, 3].map((i) => <div key={i} style={{ padding: "10px 12px" }}><Skeleton height={12} mb={6} /><Skeleton height={10} width="60%" /></div>)
          : snippets.map((s) => {
              const isActive = !isCreating && selected?.id === s.id;
              return (
                <div key={s.id} onClick={() => openNote(s)}
                  style={{ padding: isMobile ? "14px 16px" : "10px 12px", cursor: "pointer", background: isActive ? activeItemBg : "transparent", borderLeft: isActive ? "3px solid var(--mantine-color-violet-5)" : "3px solid transparent", transition: "background 0.1s" }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = hoverBg; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                  <Group justify="space-between" wrap="nowrap" gap={4}>
                    <Text size="sm" fw={600} lineClamp={1} style={{ flex: 1 }}>{s.title}</Text>
                    <ActionIcon size="xs" variant="subtle" color="red"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(s.id); }}>
                      <IconTrash size={11} />
                    </ActionIcon>
                  </Group>
                  <Badge size="xs" variant="light" color={langColor[s.language] ?? "gray"} mt={4}>{s.language}</Badge>
                </div>
              );
            })}

        {!isLoading && snippets.length === 0 && !isCreating && (
          <Stack align="center" gap="xs" py="xl">
            <IconCode size={28} style={{ color: "var(--mantine-color-dimmed)" }} />
            <Text size="xs" c="dimmed" ta="center">{search ? "Không tìm thấy" : "Chưa có snippet"}</Text>
            {!search && <Button size="xs" variant="light" onClick={() => { setSelected(null); setIsCreating(true); if (isMobile) setMobileView("editor"); }}>Tạo mới</Button>}
          </Stack>
        )}
      </div>
    </div>
  );

  // ── Editor panel ──────────────────────────────────────────────────────────
  const EditorPanel = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
      <div style={{ padding: "8px 12px", borderBottom: `1px solid ${borderColor}`, background: panelBg, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
        {isMobile && (
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => { setMobileView("list"); setIsCreating(false); }}>
            <IconArrowLeft size={16} />
          </ActionIcon>
        )}
        <input
          value={current.title}
          onChange={(e) => setCurrent((s) => ({ ...s, title: e.target.value }))}
          placeholder="Tên snippet..."
          style={{ flex: 1, minWidth: 80, border: "none", outline: "none", background: "transparent", fontSize: isMobile ? 16 : 14, fontWeight: 600, color: "inherit", fontFamily: "inherit" }}
        />
        <Group gap={4} wrap="nowrap">
          <Select size="xs" data={LANGUAGES} value={current.language}
            onChange={(v) => setCurrent((s) => ({ ...s, language: v ?? "javascript" }))}
            w={isMobile ? 110 : 130} styles={{ input: { fontSize: 12 } }} />
          {!isMobile && (
            <TextInput size="xs" placeholder="Mô tả..." value={current.description}
              onChange={(e) => setCurrent((s) => ({ ...s, description: e.target.value }))}
              w={160} styles={{ input: { fontSize: 12 } }} />
          )}
          <Tooltip label={copied ? "Đã copy!" : "Copy"}>
            <ActionIcon size="sm" variant="subtle" color={copied ? "green" : "gray"} onClick={copyCode}>
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          </Tooltip>
          {!isCreating && (
            <Text size="xs" c={isDirty ? "orange" : "dimmed"} style={{ whiteSpace: "nowrap" }}>
              {isDirty ? "..." : saveStatus === "saved" ? "✓" : ""}
            </Text>
          )}
          {isCreating ? (
            <>
              <Button size="xs" loading={creating} onClick={saveNew} leftSection={<IconDeviceFloppy size={13} />}>Lưu</Button>
              <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => { setIsCreating(false); setSelected(null); if (isMobile) setMobileView("list"); }}><IconX size={14} /></ActionIcon>
            </>
          ) : (
            <ActionIcon size="sm" variant="subtle" color="red" onClick={() => selected && setDeleteTarget(selected.id)}><IconTrash size={14} /></ActionIcon>
          )}
        </Group>
      </div>

      <textarea
        value={current.code_block}
        onChange={(e) => setCurrent((s) => ({ ...s, code_block: e.target.value }))}
        placeholder="// Dán code vào đây..."
        spellCheck={false}
        style={{
          flex: 1, resize: "none", border: "none", outline: "none",
          background: editorBg, color: "#cdd6f4",
          fontFamily: "'Fira Code', 'Cascadia Code', monospace",
          fontSize: isMobile ? 14 : 13, lineHeight: 1.7, padding: 16, tabSize: 2,
        }}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const val = e.currentTarget.value;
            const newVal = val.substring(0, start) + "  " + val.substring(end);
            setCurrent((s) => ({ ...s, code_block: newVal }));
            requestAnimationFrame(() => {
              e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
            });
          }
        }}
      />
    </div>
  );

  return (
    <div style={{ display: "flex", height: containerH, borderRadius: isMobile ? 8 : 12, overflow: "hidden", border: `1px solid ${borderColor}` }}>
      {isMobile ? (
        mobileView === "list" ? ListPanel : EditorPanel
      ) : (
        <>
          {ListPanel}
          {(selected || isCreating) ? EditorPanel : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: panelBg }}>
              <Stack align="center" gap="md">
                <IconCode size={48} style={{ color: "var(--mantine-color-dimmed)", opacity: 0.4 }} />
                <Text c="dimmed" size="sm">Chọn snippet hoặc tạo mới</Text>
                <Button variant="light" leftSection={<IconPlus size={14} />} onClick={() => { setSelected(null); setIsCreating(true); }}>
                  Snippet mới
                </Button>
              </Stack>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget !== null && deleteSnippet({ snippet: deleteTarget })}
        title="Xóa snippet" message="Bạn có chắc muốn xóa snippet này?"
        loading={deleting}
      />
    </div>
  );
}
