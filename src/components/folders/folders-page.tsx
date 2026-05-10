"use client";

import { useState } from "react";
import {
  Card, Text, Badge, Group, Stack, Modal, TextInput,
  Button, Skeleton, ActionIcon, Alert, SimpleGrid,
  ColorInput, ThemeIcon, Collapse, ScrollArea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  IconFolder, IconFolderOpen, IconPlus, IconTrash,
  IconEdit, IconAlertCircle, IconChevronRight, IconChevronDown,
} from "@tabler/icons-react";
import {
  useFoldersIndex, useFoldersStore, useFoldersUpdate, useFoldersDestroy,
  getFoldersIndexQueryKey,
} from "@/api/folders";
import { useQueryClient } from "@tanstack/react-query";
import { folderSchema, type FolderFormValues } from "@/lib/yup";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import type { FolderResource } from "@/api/folders/model";
import type { AxiosError } from "axios";

// ── Tree node ──────────────────────────────────────────────────────────────
function FolderTreeNode({
  folder,
  depth = 0,
  onEdit,
  onDelete,
  onAddChild,
}: {
  folder: FolderResource;
  depth?: number;
  onEdit: (f: FolderResource) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
}) {
  const hasChildren = (folder.children ?? []).length > 0;
  const [expanded, setExpanded] = useState(true);
  const color = folder.color ?? "#7c3aed";

  return (
    <div>
      <Card
        withBorder
        radius="lg"
        p="sm"
        mb={6}
        style={{ marginLeft: depth * 20, borderLeft: depth > 0 ? `3px solid ${color}` : undefined }}
      >
        <Group justify="space-between" wrap="nowrap" gap={8}>
          <Group gap={8} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            {/* Expand/collapse nếu có children */}
            {hasChildren ? (
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
              </ActionIcon>
            ) : (
              <div style={{ width: 22 }} />
            )}

            <ThemeIcon
              size={28}
              radius="md"
              variant="light"
              style={{ backgroundColor: color + "20", color, flexShrink: 0 }}
            >
              {expanded && hasChildren ? <IconFolderOpen size={15} /> : <IconFolder size={15} />}
            </ThemeIcon>

            <div style={{ minWidth: 0 }}>
              <Text fw={600} size="sm" lineClamp={1}>
                {folder.icon ? `${folder.icon} ` : ""}{folder.name}
              </Text>
              <Group gap={4} mt={2}>
                {folder.notes_count !== undefined && folder.notes_count > 0 && (
                  <Badge size="xs" variant="light" color="violet">{folder.notes_count} ghi chú</Badge>
                )}
                {folder.snippets_count !== undefined && folder.snippets_count > 0 && (
                  <Badge size="xs" variant="light" color="teal">{folder.snippets_count} snippet</Badge>
                )}
                {hasChildren && (
                  <Badge size="xs" variant="light" color="gray">{folder.children!.length} thư mục con</Badge>
                )}
              </Group>
            </div>
          </Group>

          <Group gap={4} wrap="nowrap">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="violet"
              title="Thêm thư mục con"
              onClick={() => onAddChild(folder.id)}
            >
              <IconPlus size={13} />
            </ActionIcon>
            <ActionIcon size="sm" variant="subtle" onClick={() => onEdit(folder)}>
              <IconEdit size={13} />
            </ActionIcon>
            <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onDelete(folder.id)}>
              <IconTrash size={13} />
            </ActionIcon>
          </Group>
        </Group>
      </Card>

      {/* Children */}
      {hasChildren && (
        <Collapse expanded={expanded}>
          {folder.children!.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </Collapse>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export function FoldersPage() {
  const qc = useQueryClient();
  const [editTarget, setEditTarget] = useState<FolderResource | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [serverError, setServerError] = useState("");

  const { data, isLoading } = useFoldersIndex();
  // API trả về flat list hoặc nested — dùng children nếu có, fallback flat
  const folders = data?.data ?? [];
  // Chỉ hiển thị root folders (parent_id === null) ở top level
  const rootFolders = folders.filter((f) => f.parent_id === null);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FolderFormValues>({ resolver: yupResolver(folderSchema) as any });

  const invalidate = () => qc.invalidateQueries({ queryKey: getFoldersIndexQueryKey() });

  const { mutate: createFolder, isPending: creating } = useFoldersStore({
    mutation: {
      onSuccess: () => { invalidate(); closeForm(); reset(); setParentId(null); },
      onError: (e: unknown) => {
        setServerError((e as AxiosError<{ message: string }>).response?.data?.message ?? "Lỗi tạo thư mục");
      },
    },
  });

  const { mutate: updateFolder, isPending: updating } = useFoldersUpdate({
    mutation: {
      onSuccess: () => { invalidate(); closeForm(); reset(); setEditTarget(null); setParentId(null); },
      onError: (e: unknown) => {
        setServerError((e as AxiosError<{ message: string }>).response?.data?.message ?? "Lỗi cập nhật");
      },
    },
  });

  const { mutate: deleteFolder, isPending: deleting } = useFoldersDestroy({
    mutation: { onSuccess: () => { invalidate(); setDeleteTarget(null); } },
  });

  const openCreate = (pid: number | null = null) => {
    setEditTarget(null);
    setParentId(pid);
    reset({ name: "", color: "#7c3aed", icon: "" });
    setServerError("");
    openForm();
  };

  const openEdit = (f: FolderResource) => {
    setEditTarget(f);
    setParentId(f.parent_id);
    reset({ name: f.name, color: f.color ?? "#7c3aed", icon: f.icon ?? "" });
    setServerError("");
    openForm();
  };

  const onSubmit = (values: FolderFormValues) => {
    if (editTarget) {
      updateFolder({
        folder: editTarget.id,
        data: { name: values.name, color: values.color ?? null, icon: values.icon ?? null, parent_id: parentId },
      });
    } else {
      createFolder({
        data: { name: values.name, color: values.color ?? null, icon: values.icon ?? null, parent_id: parentId },
      });
    }
  };

  const modalTitle = editTarget
    ? "Chỉnh sửa thư mục"
    : parentId !== null
    ? "Thêm thư mục con"
    : "Thêm thư mục";

  return (
    <div>
      <PageHeader
        title="Thư mục"
        description={`${folders.length} thư mục`}
        action={{ label: "Thêm thư mục", icon: <IconPlus size={16} />, onClick: () => openCreate(null) }}
      />

      {isLoading ? (
        <Stack gap="sm">
          {[1, 2, 3].map((i) => <Skeleton key={i} height={64} radius="lg" />)}
        </Stack>
      ) : rootFolders.length === 0 ? (
        <EmptyState
          icon={<IconFolder size={32} />}
          title="Chưa có thư mục nào"
          description="Tạo thư mục để tổ chức ghi chú và snippets"
          action={{ label: "Tạo thư mục", onClick: () => openCreate(null) }}
        />
      ) : (
        <ScrollArea>
          {rootFolders.map((f) => (
            <FolderTreeNode
              key={f.id}
              folder={f}
              onEdit={openEdit}
              onDelete={(id) => setDeleteTarget(id)}
              onAddChild={(pid) => openCreate(pid)}
            />
          ))}
        </ScrollArea>
      )}

      {/* Form Modal */}
      <Modal
        opened={formOpened}
        onClose={() => { closeForm(); reset(); setEditTarget(null); setParentId(null); }}
        title={modalTitle}
        size="sm"
        centered
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            {serverError && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {serverError}
              </Alert>
            )}
            {parentId !== null && !editTarget && (
              <Alert color="violet" variant="light">
                Thư mục con sẽ được tạo bên trong thư mục đã chọn
              </Alert>
            )}
            <TextInput
              label="Tên thư mục"
              placeholder="Tên thư mục"
              error={errors.name?.message}
              {...register("name")}
            />
            <ColorInput
              label="Màu sắc"
              value={watch("color") ?? "#7c3aed"}
              onChange={(v) => setValue("color", v)}
              format="hex"
            />
            <TextInput
              label="Icon (emoji)"
              placeholder="📁"
              error={errors.icon?.message}
              {...register("icon")}
            />
            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={() => { closeForm(); reset(); }}>Hủy</Button>
              <Button type="submit" loading={creating || updating || isSubmitting}>
                {editTarget ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <ConfirmModal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget !== null && deleteFolder({ folder: deleteTarget })}
        title="Xóa thư mục"
        message="Bạn có chắc muốn xóa thư mục này? Ghi chú và snippets bên trong sẽ không bị xóa."
        loading={deleting}
      />
    </div>
  );
}
