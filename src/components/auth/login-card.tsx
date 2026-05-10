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
  Group,
  Text,
  Paper,
  Title,
  ThemeIcon,
  Divider,
} from "@mantine/core";
import { IconAlertCircle, IconBolt } from "@tabler/icons-react";
import { useAuthLogin } from "@/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { loginSchema, type LoginFormValues } from "@/lib/yup";
import type { AxiosError } from "axios";

export function LoginCard() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
  });

  const { mutate: login, isPending } = useAuthLogin({
    mutation: {
      onSuccess: (data) => {
        setAuth(data.data, data.token);
        router.replace("/dashboard");
      },
      onError: (err: unknown) => {
        const e = err as AxiosError<{ message: string }>;
        setError("root", {
          message: e.response?.data?.message ?? "Email hoặc mật khẩu không đúng.",
        });
      },
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    login({ data: { ...values, device_name: "web" } });
  };

  return (
    <div className="w-full max-w-[420px]">
      {/* Brand */}
      <Stack align="center" gap="xs" mb="xl">
        <ThemeIcon size={52} radius="xl" variant="filled" color="violet">
          <IconBolt size={28} />
        </ThemeIcon>
        <div className="text-center">
          <Title order={2} fw={700}>Đăng nhập</Title>
          <Text size="sm" c="dimmed" mt={2}>Chào mừng trở lại LifeOS</Text>
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
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <div>
              <Group justify="space-between" mb={4}>
                <Text component="label" htmlFor="login-password" size="sm" fw={500}>
                  Mật khẩu
                </Text>
                <Anchor component={Link} href="/forgot-password" size="xs">
                  Quên mật khẩu?
                </Anchor>
              </Group>
              <PasswordInput
                id="login-password"
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            <Button type="submit" fullWidth loading={isPending || isSubmitting} mt="xs">
              Đăng nhập
            </Button>

            <Divider label="hoặc" labelPosition="center" />

            <Text ta="center" size="sm" c="dimmed">
              Chưa có tài khoản?{" "}
              <Anchor component={Link} href="/register" fw={500}>
                Đăng ký ngay
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}
