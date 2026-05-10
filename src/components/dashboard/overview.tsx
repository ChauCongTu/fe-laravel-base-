"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  SimpleGrid, Card, Text, Title, Group, ThemeIcon,
  Skeleton, Stack, Badge, Avatar, Button,
} from "@mantine/core";
import {
  IconNotes, IconCheckbox, IconCode, IconFolder,
  IconArrowRight, IconClock,
} from "@tabler/icons-react";
import { useAuthMe } from "@/api/auth";
import { useNotesIndex } from "@/api/notes";
import { useTasksIndex } from "@/api/tasks";
import { useSnippetsIndex } from "@/api/snippets";
import { useFoldersIndex } from "@/api/folders";
import { useAuthStore } from "@/stores/auth-store";

export function DashboardOverview() {
  const { setUser, user } = useAuthStore();
  const { data: me } = useAuthMe({ query: { retry: false } });
  const { data: notes, isLoading: loadingNotes } = useNotesIndex();
  const { data: tasks, isLoading: loadingTasks } = useTasksIndex();
  const { data: snippets, isLoading: loadingSnippets } = useSnippetsIndex();
  const { data: folders, isLoading: loadingFolders } = useFoldersIndex();

  useEffect(() => {
    if (me?.data) setUser(me.data);
  }, [me, setUser]);

  const currentUser = user ?? me?.data;

  const stats = [
    {
      label: "Ghi chú",
      value: notes?.data?.length,
      loading: loadingNotes,
      icon: IconNotes,
      color: "violet",
      href: "/dashboard/notes",
    },
    {
      label: "Công việc",
      value: tasks?.data?.length,
      loading: loadingTasks,
      icon: IconCheckbox,
      color: "blue",
      href: "/dashboard/tasks",
    },
    {
      label: "Snippets",
      value: snippets?.data?.length,
      loading: loadingSnippets,
      icon: IconCode,
      color: "teal",
      href: "/dashboard/snippets",
    },
    {
      label: "Thư mục",
      value: folders?.data?.length,
      loading: loadingFolders,
      icon: IconFolder,
      color: "orange",
      href: "/dashboard/folders",
    },
  ];

  const initials = currentUser?.name
    ?.split(" ").map((w: string) => w[0]).slice(-2).join("").toUpperCase() ?? "?";
  const avatarSrc = currentUser?.avatar ?? undefined;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card withBorder radius="xl" p="xl"
        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}>
        <Group justify="space-between" wrap="wrap" gap="md">
          <div>
            <Text c="white" size="sm" opacity={0.8}>Chào mừng trở lại</Text>
            <Title order={2} c="white" mt={4}>
              {currentUser?.name ?? "bạn"} 👋
            </Title>
            <Text c="white" size="sm" opacity={0.7} mt={4}>
              Hôm nay bạn muốn làm gì?
            </Text>
          </div>
          <Avatar
            src={avatarSrc}
            size={56}
            radius="xl"
            color="white"
            variant={avatarSrc ? "transparent" : "filled"}
            style={avatarSrc ? undefined : { color: "#7c3aed", background: "white" }}
          >
            {!avatarSrc && initials}
          </Avatar>
        </Group>
      </Card>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        {stats.map(({ label, value, loading, icon: Icon, color, href }) => (
          <Card key={label} withBorder radius="xl" p="md" component={Link} href={href}
            style={{ cursor: "pointer", textDecoration: "none", transition: "box-shadow 0.15s" }}>
            <Group justify="space-between" mb="xs">
              <ThemeIcon size={36} radius="md" variant="light" color={color}>
                <Icon size={20} />
              </ThemeIcon>
            </Group>
            {loading ? (
              <Skeleton height={28} width={40} radius="sm" />
            ) : (
              <Text fw={700} size="xl">{value ?? 0}</Text>
            )}
            <Text size="sm" c="dimmed">{label}</Text>
          </Card>
        ))}
      </SimpleGrid>

      {/* Recent tasks */}
      <Card withBorder radius="xl" p="xl">
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <ThemeIcon size={28} radius="md" variant="light" color="blue">
              <IconClock size={16} />
            </ThemeIcon>
            <Text fw={600}>Công việc hôm nay</Text>
          </Group>
          <Button
            variant="subtle" size="xs" rightSection={<IconArrowRight size={14} />}
            component={Link} href="/dashboard/tasks">
            Xem tất cả
          </Button>
        </Group>

        {loadingTasks ? (
          <Stack gap="sm">
            {[1, 2, 3].map((i) => <Skeleton key={i} height={40} radius="md" />)}
          </Stack>
        ) : tasks?.data?.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            Không có công việc nào hôm nay
          </Text>
        ) : (
          <Stack gap="xs">
            {tasks?.data?.slice(0, 5).map((task) => (
              <Group key={task.id} justify="space-between" p="xs"
                className="rounded-lg"
                style={{ borderRadius: 8, transition: "background 0.1s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--mantine-color-default-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                <Text size="sm" lineClamp={1} style={{ flex: 1 }}>{task.title}</Text>
                <Badge
                  size="xs" variant="light"
                  color={
                    task.status === "done" ? "green"
                    : task.status === "doing" ? "blue"
                    : "gray"
                  }>
                  {task.status_label}
                </Badge>
              </Group>
            ))}
          </Stack>
        )}
      </Card>
    </div>
  );
}
