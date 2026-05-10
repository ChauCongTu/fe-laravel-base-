"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Anchor,
  Stack,
  Text,
  Paper,
  Title,
  ThemeIcon,
  Divider,
} from "@mantine/core";
import { IconAlertCircle, IconBolt } from "@tabler/icons-react";
import { useAuthRegister } from "@/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { registerSchema, type RegisterFormValues } from "@/lib/yup";
import type { AxiosError } from "axios";

export function RegisterCard() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema),
  });

  const { mutate: doRegister, isPending } = useAuthRegister({
    mutation: {
      onSuccess: (data) => {
        setAuth(data.data, data.token);
        router.replace("/dashboard");
      },
      onError: (err: unknown) => {
        const e = err as AxiosError<{
          message: string;
          errors?: Record<string, string[]>;
        }>;
        const serverErrors = e.response?.data?.errors;
        if (serverErrors) {
          (Object.entries(serverErrors) as [keyof RegisterFormValues, string[]][]).forEach(
            ([field, messages]) => setError(field, { message: messages[0] })
          );
        } else {
          setError("root", {
            message: e.response?.data?.message ?? "Đăng ký thất bại.",
          });
        }
      },
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    doRegister({ data: { ...values, device_name: "web" } });
  };

  return (
    <div className="w-full max-w-[420px]">
      <Stack align="center" gap="xs" mb="xl">
        <ThemeIcon size={52} radius="xl" variant="filled" color="violet">
          <IconBolt size={28} />
        </ThemeIcon>
        <div className="text-center">
          <Title order={2} fw={700}>Tạo tài khoản</Title>
          <Text size="sm" c="dimmed" mt={2}>Bắt đầu hành trình của bạn</Text>
        </div>
      </Stack>

      <Paper withBorder shadow="md" p={{ base: "lg", sm: "xl" }} radius="xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            {errors.root && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" radius="md">
                {errors.root.message}
              </Alert>
            )}

            <TextInput
              label="Họ tên"
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <TextInput
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <PasswordInput
              label="Mật khẩu"
              placeholder="Tối thiểu 8 ký tự"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordInput
              label="Xác nhận mật khẩu"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password_confirmation?.message}
              {...register("password_confirmation")}
            />

            <Button type="submit" fullWidth loading={isPending || isSubmitting} mt="xs">
              Tạo tài khoản
            </Button>

            <Divider label="hoặc" labelPosition="center" />

            <Text ta="center" size="sm" c="dimmed">
              Đã có tài khoản?{" "}
              <Anchor component={Link} href="/login" fw={500}>
                Đăng nhập
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}
