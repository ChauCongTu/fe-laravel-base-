"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  TextInput,
  Button,
  Stack,
  Text,
  Paper,
  Title,
  ThemeIcon,
  Anchor,
  Center,
} from "@mantine/core";
import { IconBolt, IconCheck, IconMail } from "@tabler/icons-react";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/yup";

export function ForgotPasswordCard() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ForgotPasswordFormValues>({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const email = watch("email");

  const onSubmit = (_values: ForgotPasswordFormValues) => {
    // API chưa có trong spec — UI placeholder
  };

  return (
    <div className="w-full max-w-[420px]">
      <Stack align="center" gap="xs" mb="xl">
        <ThemeIcon size={52} radius="xl" variant="filled" color="violet">
          <IconBolt size={28} />
        </ThemeIcon>
        <div className="text-center">
          <Title order={2} fw={700}>Quên mật khẩu</Title>
          <Text size="sm" c="dimmed" mt={2}>Khôi phục quyền truy cập</Text>
        </div>
      </Stack>

      <Paper withBorder shadow="md" p={{ base: "lg", sm: "xl" }} radius="xl">
        {isSubmitSuccessful ? (
          <Stack align="center" gap="md" py="sm">
            <ThemeIcon size={56} radius="xl" color="green" variant="light">
              <IconCheck size={28} />
            </ThemeIcon>
            <div className="text-center">
              <Text fw={600}>Kiểm tra email của bạn</Text>
              <Text size="sm" c="dimmed" mt={4}>
                Nếu <strong>{email}</strong> tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.
              </Text>
            </div>
            <Anchor component={Link} href="/login" size="sm" fw={500}>
              Quay lại đăng nhập
            </Anchor>
          </Stack>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap="md">
              <Center>
                <ThemeIcon size={48} radius="xl" color="violet" variant="light">
                  <IconMail size={24} />
                </ThemeIcon>
              </Center>
              <Text size="sm" c="dimmed" ta="center">
                Nhập email đã đăng ký. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
              </Text>
              <TextInput
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <Button type="submit" fullWidth mt="xs">
                Gửi hướng dẫn
              </Button>
              <Anchor component={Link} href="/login" size="sm" c="dimmed" ta="center">
                ← Quay lại đăng nhập
              </Anchor>
            </Stack>
          </form>
        )}
      </Paper>
    </div>
  );
}
