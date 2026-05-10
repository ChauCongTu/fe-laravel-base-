"use client";

import { useState, useCallback } from "react";
import {
  Text, Badge, Group, Stack, TextInput, Textarea, Button,
  Select, Skeleton, ActionIcon, Tabs, SegmentedControl,
  Checkbox, useMantineColorScheme, Divider, Card,
} from "@mantine/core";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  IconPlus, IconTrash, IconX, IconDeviceFloppy,
  IconCheckbox, IconClock, IconLayoutList, IconLayoutKanban,
  IconArrowLeft,
} from "@tabler/icons-react";
import {
  useTasksIndex, useTasksStore, useTasksUpdate, useTasksDestroy,
  getTasksIndexQueryKey,
} from "@/api/tasks";
import { useQueryClient } from "@tanstack/react-query";
import { useAutosave } from "@/hooks/use-autosave";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import type { TaskResource } from "@/api/tasks/model";

const STATUS_OPTIONS = [
  { value: "todo",  label: "Cần làm" },
  { value: "doing", label: "Đang làm" },
  { value: "done",  label: "Hoàn thành" },
];
const PRIORITY_OPTIONS = [
  { value: "low",    label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high",   label: "Cao" },
];
const priorityColor: Record<string, string> = { low: "gray", medium: "yellow", high: "red" };
const statusColor:   Record<string, string> = { todo: "gray", doing: "blue", done: "green" };
const statusLabel:   Record<string, string> = { todo: "Cần làm", doing: "Đang làm", done: "Hoàn thành" };

interface InlineEditorState {
  title: string;
  description: string;
  status: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high";
  due_date: string;
}

// ── Kanban column ──────────────────────────────────────────────────────────
function KanbanColumn({
  status, tasks, isDark, borderColor, onOpen, onDelete,
}: {
  status: string;
  tasks: TaskResource[];
  isDark: boolean;
  borderColor: string;
  onOpen: (t: TaskResource) => void;
  onDelete: (id: number) => void;
}) {
  const colBg = isDark ? "var(--mantine-color-dark-7)" : "#ffffff";
  const headerBg = isDark ? "var(--mantine-color-dark-6)" : "#f5f5f5";

  return (
    <div
      style={{
        flex: 1,
        minWidth: 200,
        display: "flex",
        flexDirection: "column",
        background: colBg,
        borderRadius: 10,
        border: `1px solid ${borderColor}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          background: headerBg,
          borderBottom: `1px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Badge size="sm" variant="light" color={statusColor[status] ?? "gray"}>
          {statusLabel[status]}
        </Badge>
        <Text size="xs" c="dimmed">({tasks.length})</Text>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 8,
              minHeight: 60,
              background: snapshot.isDraggingOver
                ? isDark ? "var(--mantine-color-dark-6)" : "#f0eeff"
                : "transparent",
              transition: "background 0.15s",
            }}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                {(drag, dragSnapshot) => (
                  <div
                    ref={drag.innerRef}
                    {...drag.draggableProps}
                    {...drag.dragHandleProps}
                    onClick={() => onOpen(task)}
                    style={{
                      ...drag.draggableProps.style,
                      marginBottom: 6,
                      borderRadius: 8,
                      padding: "8px 10px",
                      background: dragSnapshot.isDragging
                        ? isDark ? "var(--mantine-color-dark-4)" : "#ede9fe"
                        : isDark ? "var(--mantine-color-dark-5)" : "#ffffff",
                      border: `1px solid ${borderColor}`,
                      cursor: "grab",
                      boxShadow: dragSnapshot.isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap" gap={4} mb={4}>
                      <Text size="xs" fw={500} lineClamp={2} style={{ flex: 1 }}>
                        {task.title}
                      </Text>
                      <ActionIcon
                        size="xs" variant="subtle" color="red"
                        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                      >
                        <IconTrash size={11} />
                      </ActionIcon>
                    </Group>
                    <Group gap={4} wrap="wrap">
                      {task.priority && (
                        <Badge size="xs" variant="dot" color={priorityColor[task.priority] ?? "gray"} style={{ fontSize: 9 }}>
                          {task.priority_label}
                        </Badge>
                      )}
                      {task.due_date && (
                        <Group gap={2} wrap="nowrap">
                          <IconClock size={9} style={{ color: task.is_overdue ? "var(--mantine-color-red-5)" : "var(--mantine-color-dimmed)" }} />
                          <Text size="xs" c={task.is_overdue ? "red" : "dimmed"} style={{ fontSize: 10 }}>
                            {new Date(task.due_date).toLocaleDateString("vi-VN")}
                          </Text>
                        </Group>
                      )}
                    </Group>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export function TasksPage() {
  const qc = useQueryClient();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const isMobile = useIsMobile();

  const [selected, setSelected] = useState<TaskResource | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [newTitle, setNewTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  // Mobile: "list" | "detail"
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const [editorState, setEditorState] = useState<InlineEditorState>({
    title: "", description: "", status: "todo", priority: "medium", due_date: "",
  });

  const { data, isLoading } = useTasksIndex();
  const allTasks = data?.data ?? [];
  const filtered =
    activeTab === "all" ? allTasks : allTasks.filter((t) => t.status === activeTab);

  const counts = {
    all:   allTasks.length,
    todo:  allTasks.filter((t) => t.status === "todo").length,
    doing: allTasks.filter((t) => t.status === "doing").length,
    done:  allTasks.filter((t) => t.status === "done").length,
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: getTasksIndexQueryKey() });

  const { mutate: createTask, isPending: creating } = useTasksStore({
    mutation: {
      onSuccess: (created) => {
        invalidate(); setShowNewForm(false); setNewTitle("");
        setSelected(created.data);
        setEditorState({
          title: created.data.title,
          description: created.data.description ?? "",
          status: created.data.status as "todo" | "doing" | "done",
          priority: (created.data.priority ?? "medium") as "low" | "medium" | "high",
          due_date: created.data.due_date ?? "",
        });
        if (isMobile) setMobileView("detail");
      },
    },
  });

  const { mutate: updateTask } = useTasksUpdate({
    mutation: { onSuccess: () => { invalidate(); setSaveStatus("saved"); } },
  });

  const { mutate: deleteTask, isPending: deleting } = useTasksDestroy({
    mutation: {
      onSuccess: () => {
        invalidate(); setDeleteTarget(null);
        if (selected?.id === deleteTarget) {
          setSelected(null);
          if (isMobile) setMobileView("list");
        }
      },
    },
  });

  const handleAutosave = useCallback(async (state: InlineEditorState) => {
    if (!selected) return;
    setSaveStatus("saving");
    updateTask({ task: selected.id,
      data: {
        title: state.title || "Công việc",
        description: state.description || null,
        status: state.status,
        priority: state.priority,
        due_date: state.due_date || null,
      },
    });
  }, [selected, updateTask]);

  const { isDirty } = useAutosave({
    data: editorState,
    onSave: handleAutosave,
    delay: 1000,
    enabled: !!selected,
  });

  const openTask = (task: TaskResource) => {
    setSelected(task); setShowNewForm(false);
    setEditorState({
      title: task.title,
      description: task.description ?? "",
      status: task.status as "todo" | "doing" | "done",
      priority: (task.priority ?? "medium") as "low" | "medium" | "high",
      due_date: task.due_date ?? "",
    });
    setSaveStatus("");
    if (isMobile) setMobileView("detail");
  };

  const quickCreate = () => {
    if (!newTitle.trim()) return;
    createTask({ data: { title: newTitle, status: "todo", priority: "medium" } });
  };

  const toggleDone = (task: TaskResource) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    updateTask({ task: task.id, data: { title: task.title, status: newStatus } });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as "todo" | "doing" | "done";
    const taskId = Number(result.draggableId);
    const task = allTasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    updateTask({ task: taskId, data: { title: task.title, status: newStatus } });
  };

  const panelBg = isDark ? "var(--mantine-color-dark-7)" : "white";
  const listBg = isDark ? "var(--mantine-color-dark-8)" : "#f5f5f5";
  const borderColor = isDark ? "var(--mantine-color-dark-5)" : "#e5e7eb";
  const activeItemBg = isDark ? "var(--mantine-color-dark-5)" : "#ede9fe";
  const hoverBg = isDark ? "var(--mantine-color-dark-6)" : "#f0f0f0";

  const containerH = isMobile
    ? "calc(100dvh - 56px - 16px)"
    : "calc(100vh - 56px - 32px)";

  // ── Detail panel (shared mobile/desktop) ─────────────────────────────────
  const DetailPanel = selected ? (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: panelBg,
        padding: isMobile ? 16 : 24,
        overflowY: "auto",
        minWidth: 0,
        height: "100%",
      }}
    >
      {isMobile && (
        <Group mb={12}>
          <ActionIcon variant="subtle" color="gray" onClick={() => setMobileView("list")}>
            <IconArrowLeft size={16} />
          </ActionIcon>
          <Text size="sm" c="dimmed">Quay lại</Text>
        </Group>
      )}

      <input
        value={editorState.title}
        onChange={(e) => setEditorState((s) => ({ ...s, title: e.target.value }))}
        placeholder="Tên công việc..."
        style={{
          border: "none", outline: "none", background: "transparent",
          fontSize: isMobile ? 20 : 20, fontWeight: 700, color: "inherit",
          fontFamily: "inherit", width: "100%", marginBottom: 16,
        }}
      />

      <Group gap="sm" mb="md" wrap="wrap">
        <Select
          size="sm" label="Trạng thái" data={STATUS_OPTIONS}
          value={editorState.status}
          onChange={(v) => setEditorState((s) => ({ ...s, status: (v ?? "todo") as "todo" | "doing" | "done" }))}
          style={{ flex: 1, minWidth: 130 }}
        />
        <Select
          size="sm" label="Ưu tiên" data={PRIORITY_OPTIONS}
          value={editorState.priority}
          onChange={(v) => setEditorState((s) => ({ ...s, priority: (v ?? "medium") as "low" | "medium" | "high" }))}
          style={{ flex: 1, minWidth: 130 }}
        />
        <TextInput
          size="sm" label="Hạn chót" type="datetime-local"
          value={editorState.due_date}
          onChange={(e) => setEditorState((s) => ({ ...s, due_date: e.currentTarget.value }))}
          style={{ flex: 1, minWidth: 180 }}
        />
      </Group>

      <Divider mb="md" />

      <Text size="xs" fw={500} c="dimmed" mb={6} tt="uppercase" style={{ letterSpacing: "0.05em" }}>
        Mô tả
      </Text>
      <Textarea
        value={editorState.description}
        onChange={(e) => setEditorState((s) => ({ ...s, description: e.currentTarget.value }))}
        placeholder="Thêm mô tả chi tiết..."
        minRows={isMobile ? 4 : 6}
        autosize
        styles={{
          input: {
            background: "transparent", border: "none",
            padding: 0, fontSize: isMobile ? 15 : 14, lineHeight: 1.7, resize: "none",
          },
        }}
      />

      <Group justify="space-between" mt="auto" pt="md">
        <Text size="xs" c={isDirty ? "orange" : "dimmed"}>
          {isDirty ? "Đang lưu..." : saveStatus === "saved" ? "✓ Đã lưu" : ""}
        </Text>
        <ActionIcon variant="subtle" color="red" size="sm"
          onClick={() => setDeleteTarget(selected.id)}>
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
    </div>
  ) : null;

  // ── Task list panel ───────────────────────────────────────────────────────
  const ListPanel = (
    <div
      style={{
        width: isMobile ? "100%" : 300,
        minWidth: isMobile ? undefined : 240,
        background: listBg,
        borderRight: isMobile ? "none" : `1px solid ${borderColor}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
      }}
    >
      <div style={{ padding: "12px 12px 0", borderBottom: `1px solid ${borderColor}` }}>
        <Group justify="space-between" mb={8}>
          <Text fw={600} size="sm">Công việc</Text>
          <Group gap={4}>
            {!isMobile && (
              <SegmentedControl
                size="xs"
                value={viewMode}
                onChange={(v) => setViewMode(v as "list" | "kanban")}
                data={[
                  { value: "list",   label: <IconLayoutList size={13} /> },
                  { value: "kanban", label: <IconLayoutKanban size={13} /> },
                ]}
              />
            )}
            <ActionIcon size="sm" variant="filled" color="violet"
              onClick={() => setShowNewForm(true)}>
              <IconPlus size={14} />
            </ActionIcon>
          </Group>
        </Group>
        <Tabs value={activeTab} onChange={setActiveTab} variant="pills">
          <Tabs.List style={{ gap: 2, flexWrap: "nowrap", overflowX: "auto", paddingBottom: 4 }}>
            {[
              { value: "all",   label: `Tất cả (${counts.all})` },
              { value: "todo",  label: `Cần (${counts.todo})` },
              { value: "doing", label: `Đang (${counts.doing})` },
              { value: "done",  label: `Xong (${counts.done})` },
            ].map((t) => (
              <Tabs.Tab
                key={t.value} value={t.value}
                style={{ fontSize: 11, padding: "4px 8px", whiteSpace: "nowrap" }}
              >
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
      </div>

      {showNewForm && (
        <div
          style={{
            padding: "8px 12px",
            borderBottom: `1px solid ${borderColor}`,
            background: isDark ? "var(--mantine-color-dark-6)" : "#f0eeff",
          }}
        >
          <Group gap={6}>
            <TextInput
              size="xs" placeholder="Tên công việc..." autoFocus style={{ flex: 1 }}
              value={newTitle} onChange={(e) => setNewTitle(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") quickCreate();
                if (e.key === "Escape") { setShowNewForm(false); setNewTitle(""); }
              }}
            />
            <ActionIcon size="sm" variant="filled" color="violet" loading={creating} onClick={quickCreate}>
              <IconDeviceFloppy size={13} />
            </ActionIcon>
            <ActionIcon size="sm" variant="subtle" color="gray"
              onClick={() => { setShowNewForm(false); setNewTitle(""); }}>
              <IconX size={13} />
            </ActionIcon>
          </Group>
          <Text size="xs" c="dimmed" mt={4}>Enter để lưu, Esc để hủy</Text>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto" }}>
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} style={{ padding: "10px 12px" }}>
                <Skeleton height={12} mb={6} />
                <Skeleton height={10} width="60%" />
              </div>
            ))
          : filtered.length === 0
          ? (
            <Stack align="center" gap="xs" py="xl">
              <IconCheckbox size={28} style={{ color: "var(--mantine-color-dimmed)" }} />
              <Text size="xs" c="dimmed" ta="center">Không có công việc</Text>
              <Button size="xs" variant="light" onClick={() => setShowNewForm(true)}>
                Thêm mới
              </Button>
            </Stack>
          )
          : filtered.map((task) => {
              const isActive = selected?.id === task.id;
              return (
                <div
                  key={task.id}
                  onClick={() => openTask(task)}
                  style={{
                    padding: isMobile ? "12px 16px" : "8px 12px",
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
                  <Group gap={8} wrap="nowrap">
                    <Checkbox
                      size="xs"
                      checked={task.status === "done"}
                      onChange={() => {}}
                      onClick={(e) => { e.stopPropagation(); toggleDone(task); }}
                      styles={{ input: { cursor: "pointer" } }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        size="sm" fw={500} lineClamp={1}
                        style={{
                          textDecoration: task.status === "done" ? "line-through" : "none",
                          opacity: task.status === "done" ? 0.6 : 1,
                        }}
                      >
                        {task.title}
                      </Text>
                      <Group gap={4} mt={2} wrap="nowrap">
                        {task.priority && (
                          <Badge
                            size="xs" variant="dot"
                            color={priorityColor[task.priority] ?? "gray"}
                            style={{ fontSize: 9 }}
                          >
                            {task.priority_label}
                          </Badge>
                        )}
                        {task.due_date && (
                          <Group gap={2} wrap="nowrap">
                            <IconClock
                              size={9}
                              style={{
                                color: task.is_overdue
                                  ? "var(--mantine-color-red-5)"
                                  : "var(--mantine-color-dimmed)",
                                flexShrink: 0,
                              }}
                            />
                            <Text
                              size="xs"
                              c={task.is_overdue ? "red" : "dimmed"}
                              style={{ fontSize: 10 }}
                            >
                              {new Date(task.due_date).toLocaleDateString("vi-VN")}
                            </Text>
                          </Group>
                        )}
                      </Group>
                    </div>
                    <ActionIcon
                      size="xs" variant="subtle" color="red"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(task.id); }}
                    >
                      <IconTrash size={11} />
                    </ActionIcon>
                  </Group>
                </div>
              );
            })}
      </div>
    </div>
  );

  // ── Kanban view ───────────────────────────────────────────────────────────
  if (viewMode === "kanban" && !isMobile) {
    return (
      <div style={{ height: containerH, display: "flex", flexDirection: "column" }}>
        <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
          <Group gap="sm">
            <Text fw={600}>Công việc</Text>
            <Badge variant="light">{allTasks.length}</Badge>
          </Group>
          <Group gap="sm">
            <Button size="xs" leftSection={<IconPlus size={13} />} variant="light"
              onClick={() => setShowNewForm(true)}>
              Thêm mới
            </Button>
            <SegmentedControl
              size="xs"
              value={viewMode}
              onChange={(v) => setViewMode(v as "list" | "kanban")}
              data={[
                { value: "list",   label: <IconLayoutList size={14} /> },
                { value: "kanban", label: <IconLayoutKanban size={14} /> },
              ]}
            />
          </Group>
        </Group>

        {showNewForm && (
          <Card withBorder radius="md" p="sm" mb="md">
            <Group gap={6}>
              <TextInput
                size="xs" placeholder="Tên công việc..." autoFocus style={{ flex: 1 }}
                value={newTitle} onChange={(e) => setNewTitle(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") quickCreate();
                  if (e.key === "Escape") { setShowNewForm(false); setNewTitle(""); }
                }}
              />
              <ActionIcon size="sm" variant="filled" color="violet" loading={creating} onClick={quickCreate}>
                <IconDeviceFloppy size={13} />
              </ActionIcon>
              <ActionIcon size="sm" variant="subtle" color="gray"
                onClick={() => { setShowNewForm(false); setNewTitle(""); }}>
                <IconX size={13} />
              </ActionIcon>
            </Group>
          </Card>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: "flex", gap: 12, flex: 1, overflow: "hidden" }}>
            {(["todo", "doing", "done"] as const).map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={allTasks.filter((t) => t.status === status)}
                isDark={isDark}
                borderColor={borderColor}
                onOpen={openTask}
                onDelete={(id) => setDeleteTarget(id)}
              />
            ))}
          </div>
        </DragDropContext>

        <ConfirmModal
          opened={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget !== null && deleteTask({ task: deleteTarget })}
          title="Xóa công việc" message="Bạn có chắc muốn xóa công việc này?"
          loading={deleting}
        />
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        height: containerH,
        borderRadius: isMobile ? 8 : 12,
        overflow: "hidden",
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Mobile: show list OR detail */}
      {isMobile ? (
        mobileView === "list" ? ListPanel : DetailPanel
      ) : (
        <>
          {ListPanel}
          {selected ? (
            DetailPanel
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
                <IconCheckbox
                  size={48}
                  style={{ color: "var(--mantine-color-dimmed)", opacity: 0.4 }}
                />
                <Text c="dimmed" size="sm">Chọn công việc để xem chi tiết</Text>
                <Button variant="light" leftSection={<IconPlus size={14} />}
                  onClick={() => setShowNewForm(true)}>
                  Thêm công việc
                </Button>
              </Stack>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget !== null && deleteTask({ task: deleteTarget })}
        title="Xóa công việc" message="Bạn có chắc muốn xóa công việc này?"
        loading={deleting}
      />
    </div>
  );
}
