"use client";

import { useState } from "react";
import {
  Card, Text, Badge, Group, Stack, Modal, TextInput,
  Button, Skeleton, ActionIcon, Alert, SimpleGrid,
  ColorInput, ThemeIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { IconFolder, IconPlus, IconTrash, IconEdit, IconAlertCircle } from "@tabler/icons-react";
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

export function FoldersPage() {
  const qc = useQueryClient();
  const [editTarget, setEditTarget] = useState<FolderResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [serverError, setServerError] = useState("");

  const { data, isLoading } = useFoldersIndex();
  const folders = data?.data ?? [];

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FolderFormValues>({ resolver: yupResolver(folderSchema) as any });

  const invalidate = () => qc.invalidateQueries({ queryKey: getFoldersIndexQueryKey() });

  const { mutate: createFolder, isPending: creating } = useFoldersStore({
    mutation: {
      onSuccess: () => { invalidate(); closeForm(); reset(); },
      onError: (e: unknown) => {
        setServerError((e as AxiosError<{ message: string }>).response?.data?.message ?? "Lỗi tạo thư mục");
      },
    },
  });

  const { mutate: updateFolder, isPending: updating } = useFoldersUpdate({
    mutation: {
      onSuccess: () => { invalidate(); closeForm(); reset(); setEditTarget(null); },
      onError: (e: unknown) => {
        setServerError((e as AxiosError<{ message: string }>).response?.data?.message ?? "Lỗi cập nhật");
      },
    },
  });

  const { mutate: deleteFolder, isPending: deleting } = useFoldersDestroy({
    mutation: { onSuccess: () => { invalidate(); setDeleteTarget(null); } },
  });

  const openCreate = () => {
    setEditTarget(null);
    reset({ name: "", color: "#7c3aed", icon: "" });
    setServerError("");
    openForm();
  };

  const openEdit = (f: FolderResource) => {
    setEditTarget(f);
    reset({ name: f.name, color: f.color ?? "#7c3aed", icon: f.icon ?? "" });
    setServerError("");
    openForm();
  };

  const onSubmit = (values: FolderFormValues) => {
    if (editTarget) {
      updateFolder({ folder: editTarget.id, data: { name: values.name, color: values.color ?? null, icon: values.icon ?? null } });
    } else {
      createFolder({ data: { name: values.name, color: values.color ?? null, icon: values.icon ?? null } });
    }
  };

  return (
    <div>
      <PageHeader
        title="Thư mục"
        description={`${folders.length} thư mục`}
        action={{ label: "Thêm thư mục", icon: <IconPlus size={16} />, onClick: openCreate }}
      />

      {isLoading ? (
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={100} radius="xl" />)}
        </SimpleGrid>
      ) : folders.length === 0 ? (
        <EmptyState
          icon={<IconFolder size={32} />}
          title="Chưa có thư mục nào"
          description="Tạo thư mục để tổ chức ghi chú và snippets"
          action={{ label: "Tạo thư mục", onClick: openCreate }}
        />
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
          {folders.map((f) => (
            <Card key={f.id} withBorder radius="xl" p="md"
              className="hover:shadow-md transition-shadow">
              <Group justify="space-between" mb="sm" wrap="nowrap">
                <ThemeIcon size={36} radius="md" variant="light"
                  style={{ backgroundColor: (f.color ?? "#7c3aed") + "20", color: f.color ?? "#7c3aed" }}>
                  <IconFolder size={20} />
                </ThemeIcon>
                <Group gap={4} wrap="nowrap">
                  <ActionIcon variant="subtle" size="sm" onClick={() => openEdit(f)}>
                    <IconEdit size={14} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" size="sm"
                    onClick={() => setDeleteTarget(f.id)}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
              <Text fw={600} size="sm" lineClamp={1}>{f.name}</Text>
              <Group gap="xs" mt="xs">
                {f.notes_count !== undefined && (
                  <Badge size="xs" variant="light" color="violet">{f.notes_count} ghi chú</Badge>
                )}
                {f.snippets_count !== undefined && (
                  <Badge size="xs" variant="light" color="teal">{f.snippets_count} snippet</Badge>
                )}
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Form Modal */}
      <Modal
        opened={formOpened}
        onClose={() => { closeForm(); reset(); setEditTarget(null); }}
        title={editTarget ? "Chỉnh sửa thư mục" : "Thêm thư mục"}
        size="sm" centered
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            {serverError && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {serverError}
              </Alert>
            )}
            <TextInput label="Tên thư mục" placeholder="Tên thư mục"
              error={errors.name?.message} {...register("name")} />
            <ColorInput
              label="Màu sắc"
              value={watch("color") ?? "#7c3aed"}
              onChange={(v) => setValue("color", v)}
              format="hex"
            />
            <TextInput label="Icon (emoji)" placeholder="📁"
              error={errors.icon?.message} {...register("icon")} />
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
