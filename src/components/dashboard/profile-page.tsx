"use client";

import { useState } from "react";
import {
  Card, Text, Group, Stack, Avatar, Badge, SimpleGrid,
  TextInput, PasswordInput, Button, Alert, Divider, Title,
  Select, ActionIcon, Tooltip, FileButton,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  IconAlertCircle, IconCheck, IconCamera, IconTrash,
} from "@tabler/icons-react";
import {
  useAuthUpdateProfile, useAuthChangePassword,
  useAuthUploadAvatar, useAuthDeleteAvatar,
} from "@/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import {
  changePasswordSchema, updateProfileSchema,
  type ChangePasswordFormValues, type UpdateProfileFormValues,
} from "@/lib/yup";
import type { AxiosError } from "axios";

const GENDER_OPTIONS = [
  { value: "male",              label: "Nam" },
  { value: "female",            label: "Nữ" },
  { value: "other",             label: "Khác" },
  { value: "prefer_not_to_say", label: "Không muốn tiết lộ" },
];

export function ProfilePage() {
  const { setUser, user } = useAuthStore();

  const currentUser = user;
  const initials = currentUser?.name
    ?.split(" ").map((w: string) => w[0]).slice(-2).join("").toUpperCase() ?? "?";

  // ── Avatar ────────────────────────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { mutate: uploadAvatar, isPending: uploadingAvatar } = useAuthUploadAvatar({
    mutation: {
      onSuccess: (data) => {
        setUser(data.data);
        setAvatarPreview(null);
      },
    },
  });

  const { mutate: deleteAvatar, isPending: deletingAvatar } = useAuthDeleteAvatar({
    mutation: {
      onSuccess: (data) => {
        setUser(data.data);
        setAvatarPreview(null);
      },
    },
  });

  const handleAvatarFile = (file: File | null) => {
    if (!file) return;
    // Preview
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    // Upload
    uploadAvatar({ data: { avatar: file } });
  };

  const avatarSrc = avatarPreview ?? currentUser?.avatar ?? undefined;

  // ── Profile form ──────────────────────────────────────────────────────────
  const {
    register: regProfile,
    handleSubmit: handleProfile,
    setError: setProfileError,
    setValue: setProfileValue,
    watch: watchProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting, isSubmitSuccessful: profileSuccess },
  } = useForm<UpdateProfileFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(updateProfileSchema) as any,
    values: {
      name:        currentUser?.name        ?? "",
      user_name:   currentUser?.user_name   ?? "",
      email:       currentUser?.email       ?? "",
      phone:       currentUser?.phone       ?? "",
      nationality: currentUser?.nationality ?? "",
      city:        currentUser?.city        ?? "",
      address:     currentUser?.address     ?? "",
      gender:      (currentUser?.gender ?? "") as "" | "male" | "female" | "other" | "prefer_not_to_say",
    },
  });

  const { mutate: updateProfile, isPending: updatingProfile } = useAuthUpdateProfile({
    mutation: {
      onSuccess: (data) => {
        setUser(data.data);
      },
      onError: (e: unknown) => {
        const err = e as AxiosError<{ message: string; errors?: Record<string, string[]> }>;
        const serverErrors = err.response?.data?.errors;
        if (serverErrors) {
          (Object.entries(serverErrors) as [keyof UpdateProfileFormValues, string[]][]).forEach(
            ([f, msgs]) => setProfileError(f, { message: msgs[0] })
          );
        } else {
          setProfileError("root", {
            message: err.response?.data?.message ?? "Cập nhật thất bại",
          });
        }
      },
    },
  });

  // ── Password form ─────────────────────────────────────────────────────────
  const {
    register: regPwd,
    handleSubmit: handlePwd,
    setError: setPwdError,
    reset: resetPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSubmitting, isSubmitSuccessful: pwdSuccess },
  } = useForm<ChangePasswordFormValues>({ resolver: yupResolver(changePasswordSchema) });

  const { mutate: changePassword, isPending: changingPwd } = useAuthChangePassword({
    mutation: {
      onSuccess: () => resetPwd(),
      onError: (e: unknown) => {
        const err = e as AxiosError<{ message: string; errors?: Record<string, string[]> }>;
        const serverErrors = err.response?.data?.errors;
        if (serverErrors) {
          (Object.entries(serverErrors) as [keyof ChangePasswordFormValues, string[]][]).forEach(
            ([f, msgs]) => setPwdError(f, { message: msgs[0] })
          );
        } else {
          setPwdError("root", {
            message: err.response?.data?.message ?? "Đổi mật khẩu thất bại",
          });
        }
      },
    },
  });

  return (
    <div style={{ maxWidth: 680 }}>
      <Title order={3} mb="lg">Hồ sơ cá nhân</Title>

      {/* ── Avatar + basic info ── */}
      <Card withBorder radius="xl" p="xl" mb="md">
        <Group gap="lg" wrap="wrap" align="flex-start">
          {/* Avatar with upload overlay */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              src={avatarSrc}
              size={80}
              radius="xl"
              color="violet"
              variant={avatarSrc ? "transparent" : "filled"}
            >
              {!avatarSrc && initials}
            </Avatar>

            {/* Upload overlay */}
            <FileButton onChange={handleAvatarFile} accept="image/*">
              {(props) => (
                <Tooltip label="Đổi ảnh đại diện">
                  <ActionIcon
                    {...props}
                    size="sm"
                    radius="xl"
                    variant="filled"
                    color="violet"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    }}
                    loading={uploadingAvatar}
                  >
                    <IconCamera size={13} />
                  </ActionIcon>
                </Tooltip>
              )}
            </FileButton>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" align="center" mb={4}>
              <Text fw={700} size="lg" lineClamp={1}>{currentUser?.name}</Text>
              {currentUser?.user_name && (
                <Text size="sm" c="dimmed">@{currentUser.user_name}</Text>
              )}
            </Group>
            <Text size="sm" c="dimmed" mb={6}>{currentUser?.email}</Text>
            <Group gap="xs" wrap="wrap">
              <Badge size="sm" variant="light"
                color={currentUser?.email_verified_at ? "green" : "orange"}>
                {currentUser?.email_verified_at ? "Email đã xác thực" : "Chưa xác thực"}
              </Badge>
              {currentUser?.avatar && (
                <Tooltip label="Xóa ảnh đại diện">
                  <ActionIcon
                    size="sm" variant="subtle" color="red"
                    loading={deletingAvatar}
                    onClick={() => deleteAvatar()}
                  >
                    <IconTrash size={13} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </div>
        </Group>

        <Divider my="md" />

        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
          {[
            { label: "ID",           value: String(currentUser?.id ?? "—") },
            { label: "Múi giờ",      value: currentUser?.timezone ?? "—" },
            { label: "Ngôn ngữ",     value: currentUser?.locale ?? "—" },
            { label: "Ngày tham gia", value: currentUser?.created_at
                ? new Date(currentUser.created_at).toLocaleDateString("vi-VN") : "—" },
          ].map(({ label, value }) => (
            <Stack key={label} gap={2}>
              <Text size="xs" fw={500} tt="uppercase" c="dimmed"
                style={{ letterSpacing: "0.05em" }}>
                {label}
              </Text>
              <Text size="sm">{value}</Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Card>

      {/* ── Update profile ── */}
      <Card withBorder radius="xl" p="xl" mb="md">
        <Text fw={600} mb="md">Cập nhật thông tin</Text>
        <form onSubmit={handleProfile((v) => {
          const { gender, ...rest } = v;
          updateProfile({
            data: {
              ...rest,
              // Cast gender sang đúng enum type của API
              gender: (gender || null) as import("@/api/auth/model").UpdateProfileRequestGender,
            },
          });
        })}>
          <Stack gap="md">
            {profileErrors.root && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {profileErrors.root.message}
              </Alert>
            )}
            {profileSuccess && !profileErrors.root && (
              <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                Cập nhật thành công!
              </Alert>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="Họ tên"
                error={profileErrors.name?.message}
                {...regProfile("name")}
              />
              <TextInput
                label="Tên người dùng"
                placeholder="@username"
                error={profileErrors.user_name?.message}
                {...regProfile("user_name")}
              />
              <TextInput
                label="Email"
                type="email"
                error={profileErrors.email?.message}
                {...regProfile("email")}
              />
              <TextInput
                label="Số điện thoại"
                placeholder="+84..."
                error={profileErrors.phone?.message}
                {...regProfile("phone")}
              />
              <Select
                label="Giới tính"
                data={GENDER_OPTIONS}
                value={watchProfile("gender") ?? ""}
                onChange={(v) => setProfileValue("gender", (v ?? "") as "" | "male" | "female" | "other" | "prefer_not_to_say")}
                clearable
                placeholder="Chọn giới tính"
              />
              <TextInput
                label="Quốc tịch"
                placeholder="Việt Nam"
                error={profileErrors.nationality?.message}
                {...regProfile("nationality")}
              />
              <TextInput
                label="Thành phố"
                placeholder="Hà Nội"
                error={profileErrors.city?.message}
                {...regProfile("city")}
              />
              <TextInput
                label="Địa chỉ"
                placeholder="123 Đường ABC..."
                error={profileErrors.address?.message}
                {...regProfile("address")}
              />
            </SimpleGrid>

            <Group justify="flex-end">
              <Button
                type="submit"
                loading={updatingProfile || profileSubmitting}
                size="sm"
              >
                Lưu thay đổi
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>

      {/* ── Change password ── */}
      <Card withBorder radius="xl" p="xl">
        <Text fw={600} mb="md">Đổi mật khẩu</Text>
        <form onSubmit={handlePwd((v) => changePassword({ data: v }))}>
          <Stack gap="md">
            {pwdErrors.root && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {pwdErrors.root.message}
              </Alert>
            )}
            {pwdSuccess && !pwdErrors.root && (
              <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                Đổi mật khẩu thành công!
              </Alert>
            )}
            <PasswordInput
              label="Mật khẩu hiện tại"
              error={pwdErrors.current_password?.message}
              {...regPwd("current_password")}
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <PasswordInput
                label="Mật khẩu mới"
                error={pwdErrors.password?.message}
                {...regPwd("password")}
              />
              <PasswordInput
                label="Xác nhận mật khẩu mới"
                error={pwdErrors.password_confirmation?.message}
                {...regPwd("password_confirmation")}
              />
            </SimpleGrid>
            <Group justify="flex-end">
              <Button
                type="submit"
                loading={changingPwd || pwdSubmitting}
                size="sm"
              >
                Đổi mật khẩu
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </div>
  );
}
