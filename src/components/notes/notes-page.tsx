"use client";

import { useState, useCallback } from "react";
import {
  Text, Group, Stack, TextInput, Button, Select,
  Skeleton, ActionIcon, Tooltip, SegmentedControl,
  useMantineColorScheme,
} from "@mantine/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  IconNotes, IconPlus, IconTrash, IconPin, IconPinFilled,
  IconDeviceFloppy, IconX, IconSearch, IconMarkdown,
  IconEye, IconEdit, IconArrowLeft,
} from "@tabler/icons-react";
import {
  useNotesIndex, useNotesStore, useNotesUpdate, useNotesDestroy,
  getNotesIndexQueryKey,
} from "@/api/notes";
import { useQueryClient } from "@tanstack/react-query";
import { useAutosave } from "@/hooks/use-autosave";
import { useDraft } from "@/hooks/use-draft";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import type { NoteResource } from "@/api/notes/model";

interface EditorState {
  title: string;
  content: string;
  type: "text" | "markdown";
  is_pinned: boolean;
}

const EMPTY_DRAFT: EditorState = {
  title: "", content: "", type: "text", is_pinned: false,
};

export function NotesPage() {
  const qc = useQueryClient();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const isMobile = useIsMobile();

  const [selectedNote, setSelectedNote] = useState<NoteResource | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "dirty" | "">("");
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("edit");

  // Mobile: "list" | "editor"
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");

  const [draft, setDraft, clearDraft] = useDraft<EditorState>("new-note", EMPTY_DRAFT);
  const [editorState, setEditorState] = useState<EditorState>(EMPTY_DRAFT);

  const { data, isLoading } = useNotesIndex();
  const notes = (data?.data ?? []).filter(
    (n) =>
      search === "" ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: getNotesIndexQueryKey() });

  const { mutate: createNote, isPending: creating } = useNotesStore({
    mutation: {
      onSuccess: (created) => {
        invalidate();
        clearDraft();
        setIsCreating(false);
        setSelectedNote(created.data);
        setEditorState({
          title: created.data.title,
          content: created.data.content,
          type: created.data.type as "text" | "markdown",
          is_pinned: created.data.is_pinned,
        });
        setSaveStatus("saved");
        if (isMobile) setMobileView("editor");
      },
    },
  });

  const { mutate: updateNote } = useNotesUpdate({
    mutation: {
      onSuccess: () => { invalidate(); setSaveStatus("saved"); },
    },
  });

  const { mutate: deleteNote, isPending: deleting } = useNotesDestroy({
    mutation: {
      onSuccess: () => {
        invalidate();
        setDeleteTarget(null);
        if (selectedNote?.id === deleteTarget) {
          setSelectedNote(null);
          setIsCreating(false);
          if (isMobile) setMobileView("list");
        }
      },
    },
  });

  const handleAutosave = useCallback(
    async (state: EditorState) => {
      if (!selectedNote) return;
      setSaveStatus("saving");
      updateNote({
        note: selectedNote.id,
        data: {
          title: state.title || "Không có tiêu đề",
          content: state.content,
          type: state.type,
          is_pinned: state.is_pinned,
        },
      });
    },
    [selectedNote, updateNote]
  );

  const { isDirty } = useAutosave({
    data: editorState,
    onSave: handleAutosave,
    delay: 1200,
    enabled: !!selectedNote && !isCreating,
  });

  useAutosave({ data: draft, onSave: async () => {}, delay: 500, enabled: isCreating });

  const openNewNote = () => {
    setSelectedNote(null);
    setIsCreating(true);
    setViewMode("edit");
    if (isMobile) setMobileView("editor");
  };

  const openNote = (note: NoteResource) => {
    setIsCreating(false);
    setSelectedNote(note);
    setEditorState({
      title: note.title,
      content: note.content,
      type: note.type as "text" | "markdown",
      is_pinned: note.is_pinned,
    });
    setSaveStatus("");
    setViewMode("edit");
    if (isMobile) setMobileView("editor");
  };

  const saveNewNote = () => {
    if (!draft.title.trim() && !draft.content.trim()) return;
    createNote({
      data: {
        title: draft.title || "Không có tiêu đề",
        content: draft.content,
        type: draft.type,
        is_pinned: draft.is_pinned,
      },
    });
  };

  const goBackToList = () => {
    setMobileView("list");
    setIsCreating(false);
  };

  const currentState = isCreating ? draft : editorState;
  const setCurrentState = isCreating
    ? (v: EditorState | ((p: EditorState) => EditorState)) =>
        setDraft(typeof v === "function" ? v(draft) : v)
    : (v: EditorState | ((p: EditorState) => EditorState)) =>
        setEditorState(typeof v === "function" ? v(editorState) : v);

  const isMarkdown = currentState.type === "markdown";

  // Colors
  const panelBg = isDark ? "var(--mantine-color-dark-7)" : "#ffffff";
  const listBg = isDark ? "var(--mantine-color-dark-8)" : "#f5f5f5";
  const previewBg = isDark ? "var(--mantine-color-dark-8)" : "#fafafa";
  const borderColor = isDark ? "var(--mantine-color-dark-5)" : "#e5e7eb";
  const activeItemBg = isDark ? "var(--mantine-color-dark-5)" : "#ede9fe";
  const hoverBg = isDark ? "var(--mantine-color-dark-6)" : "#f0f0f0";

  // ── Shared: Note list panel ──────────────────────────────────────────────
  const ListPanel = (
    <div
      style={{
        width: isMobile ? "100%" : 260,
        minWidth: isMobile ? undefined : 220,
        background: listBg,
        borderRight: isMobile ? "none" : `1px solid ${borderColor}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
      }}
    >
      <div style={{ padding: "12px 12px 8px", borderBottom: `1px solid ${borderColor}` }}>
        <Group justify="space-between" mb={8}>
          <Text fw={600} size="sm">Ghi chú</Text>
          <Tooltip label="Ghi chú mới" position="right">
            <ActionIcon size="sm" variant="filled" color="violet" onClick={openNewNote}>
              <IconPlus size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <TextInput
          size="xs"
          placeholder="Tìm kiếm..."
          leftSection={<IconSearch size={13} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          styles={{ input: { background: "transparent" } }}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {isCreating && !isMobile && (
          <div
            style={{
              padding: "10px 12px",
              background: activeItemBg,
              borderLeft: "3px solid var(--mantine-color-violet-5)",
              cursor: "pointer",
            }}
          >
            <Text size="xs" fw={600} c="violet" lineClamp={1}>
              {draft.title || "Ghi chú mới..."}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
              {draft.content || "Chưa có nội dung"}
            </Text>
          </div>
        )}

        {isLoading
          ? [1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ padding: "10px 12px" }}>
                <Skeleton height={12} mb={6} radius="sm" />
                <Skeleton height={10} width="70%" radius="sm" />
              </div>
            ))
          : notes.map((note) => {
              const isActive = !isCreating && selectedNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => openNote(note)}
                  style={{
                    padding: isMobile ? "14px 16px" : "10px 12px",
                    cursor: "pointer",
                    background: isActive ? activeItemBg : "transparent",
                    borderLeft: isActive
                      ? "3px solid var(--mantine-color-violet-5)"
                      : "3px solid transparent",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLDivElement).style.background = hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  <Group justify="space-between" wrap="nowrap" gap={4}>
                    <Text size="sm" fw={600} lineClamp={1} style={{ flex: 1 }}>
                      {note.title}
                    </Text>
                    <Group gap={4} wrap="nowrap">
                      {note.is_pinned && (
                        <IconPinFilled
                          size={11}
                          style={{ color: "var(--mantine-color-violet-5)", flexShrink: 0 }}
                        />
                      )}
                      {note.type === "markdown" && (
                        <IconMarkdown
                          size={11}
                          style={{ color: "var(--mantine-color-dimmed)", flexShrink: 0 }}
                        />
                      )}
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(note.id);
                        }}
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                    </Group>
                  </Group>
                  <Text size="xs" c="dimmed" lineClamp={isMobile ? 2 : 1} mt={2}>
                    {note.content}
                  </Text>
                  <Text size="xs" c="dimmed" mt={4} style={{ fontSize: 10 }}>
                    {new Date(note.updated_at).toLocaleDateString("vi-VN")}
                  </Text>
                </div>
              );
            })}

        {!isLoading && notes.length === 0 && !isCreating && (
          <Stack align="center" gap="xs" py="xl">
            <IconNotes size={32} style={{ color: "var(--mantine-color-dimmed)" }} />
            <Text size="sm" c="dimmed" ta="center">
              {search ? "Không tìm thấy" : "Chưa có ghi chú"}
            </Text>
            {!search && (
              <Button size="sm" variant="light" onClick={openNewNote}>
                Tạo mới
              </Button>
            )}
          </Stack>
        )}
      </div>
    </div>
  );

  // ── Shared: Editor panel ─────────────────────────────────────────────────
  const EditorPanel = (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: panelBg,
        minWidth: 0,
        height: "100%",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: `1px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        {/* Back button on mobile */}
        {isMobile && (
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={goBackToList}>
            <IconArrowLeft size={16} />
          </ActionIcon>
        )}

        <input
          value={currentState.title}
          onChange={(e) => setCurrentState((s) => ({ ...s, title: e.target.value }))}
          placeholder="Tiêu đề..."
          style={{
            flex: 1,
            minWidth: 80,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: isMobile ? 16 : 15,
            fontWeight: 600,
            color: "inherit",
            fontFamily: "inherit",
          }}
        />

        <Group gap={4} wrap="nowrap">
          <Select
            size="xs"
            data={[
              { value: "text", label: "Text" },
              { value: "markdown", label: "MD" },
            ]}
            value={currentState.type}
            onChange={(v) => {
              setCurrentState((s) => ({ ...s, type: (v ?? "text") as "text" | "markdown" }));
              if (v !== "markdown") setViewMode("edit");
            }}
            w={isMobile ? 80 : 100}
            leftSection={<IconMarkdown size={12} />}
            styles={{ input: { fontSize: 11 } }}
          />

          {isMarkdown && !isMobile && (
            <SegmentedControl
              size="xs"
              value={viewMode}
              onChange={(v) => setViewMode(v as "edit" | "preview" | "split")}
              data={[
                { value: "edit", label: <IconEdit size={12} /> },
                { value: "split", label: <span style={{ fontSize: 10 }}>Split</span> },
                { value: "preview", label: <IconEye size={12} /> },
              ]}
            />
          )}

          {isMarkdown && isMobile && (
            <ActionIcon
              size="sm"
              variant={viewMode === "preview" ? "filled" : "subtle"}
              color="violet"
              onClick={() => setViewMode(viewMode === "preview" ? "edit" : "preview")}
            >
              {viewMode === "preview" ? <IconEdit size={14} /> : <IconEye size={14} />}
            </ActionIcon>
          )}

          <Tooltip label={currentState.is_pinned ? "Bỏ ghim" : "Ghim"}>
            <ActionIcon
              size="sm"
              variant={currentState.is_pinned ? "filled" : "subtle"}
              color="violet"
              onClick={() => setCurrentState((s) => ({ ...s, is_pinned: !s.is_pinned }))}
            >
              {currentState.is_pinned ? <IconPinFilled size={13} /> : <IconPin size={13} />}
            </ActionIcon>
          </Tooltip>

          {!isCreating && (
            <Text size="xs" c={isDirty ? "orange" : "dimmed"} style={{ whiteSpace: "nowrap" }}>
              {isDirty ? "..." : saveStatus === "saved" ? "✓" : ""}
            </Text>
          )}

          {isCreating ? (
            <>
              <Button
                size="xs"
                loading={creating}
                onClick={saveNewNote}
                leftSection={<IconDeviceFloppy size={12} />}
              >
                Lưu
              </Button>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={() => {
                  setIsCreating(false);
                  setSelectedNote(null);
                  if (isMobile) setMobileView("list");
                }}
              >
                <IconX size={14} />
              </ActionIcon>
            </>
          ) : (
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={() => selectedNote && setDeleteTarget(selectedNote.id)}
            >
              <IconTrash size={13} />
            </ActionIcon>
          )}
        </Group>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {(viewMode === "edit" || viewMode === "split") && (
          <textarea
            value={currentState.content}
            onChange={(e) => setCurrentState((s) => ({ ...s, content: e.target.value }))}
            placeholder={
              isMarkdown
                ? "# Tiêu đề\n\nViết **markdown** ở đây..."
                : "Bắt đầu viết..."
            }
            spellCheck={false}
            style={{
              flex: 1,
              resize: "none",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "inherit",
              fontFamily: isMarkdown
                ? "'Fira Code', 'Cascadia Code', monospace"
                : "inherit",
              fontSize: isMobile ? 15 : 13,
              lineHeight: 1.8,
              padding: isMobile ? "16px" : "16px",
              borderRight:
                viewMode === "split" ? `1px solid ${borderColor}` : "none",
            }}
          />
        )}

        {isMarkdown && (viewMode === "preview" || viewMode === "split") && (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: isMobile ? "16px" : "16px 24px",
              background: previewBg,
            }}
            className="markdown-preview"
          >
            {currentState.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentState.content}
              </ReactMarkdown>
            ) : (
              <Text c="dimmed" size="sm" fs="italic">
                Chưa có nội dung...
              </Text>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    display: "flex",
    height: isMobile ? "calc(100dvh - 56px - 16px)" : "calc(100vh - 56px - 32px)",
    borderRadius: isMobile ? 8 : 12,
    overflow: "hidden",
    border: `1px solid ${borderColor}`,
  };

  if (isMobile) {
    return (
      <div style={containerStyle}>
        {mobileView === "list" ? ListPanel : EditorPanel}

        {/* Empty state khi chưa chọn note và ở list view */}
        {mobileView === "list" && !isCreating && notes.length === 0 && !isLoading && (
          <></>
        )}

        <ConfirmModal
          opened={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget !== null && deleteNote({ note: deleteTarget })}
          title="Xóa ghi chú"
          message="Bạn có chắc muốn xóa ghi chú này?"
          loading={deleting}
        />
      </div>
    );
  }

  // Desktop: split panel
  return (
    <div style={containerStyle}>
      {ListPanel}

      {selectedNote || isCreating ? (
        EditorPanel
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: panelBg,
          }}
        >
          <Stack align="center" gap="md">
            <IconNotes
              size={48}
              style={{ color: "var(--mantine-color-dimmed)", opacity: 0.4 }}
            />
            <Text c="dimmed" size="sm">
              Chọn một ghi chú hoặc tạo mới
            </Text>
            <Button variant="light" leftSection={<IconPlus size={14} />} onClick={openNewNote}>
              Ghi chú mới
            </Button>
          </Stack>
        </div>
      )}

      <ConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget !== null && deleteNote({ note: deleteTarget })}
        title="Xóa ghi chú"
        message="Bạn có chắc muốn xóa ghi chú này?"
        loading={deleting}
      />
    </div>
  );
}
