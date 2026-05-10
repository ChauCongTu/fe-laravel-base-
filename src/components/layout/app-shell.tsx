"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppShell, Burger, Group, NavLink, Text, ThemeIcon,
  Avatar, Menu, UnstyledButton, Divider, ScrollArea,
  ActionIcon, Tooltip, UnstyledButton as UB,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBolt, IconLayoutDashboard, IconNotes, IconCheckbox,
  IconCode, IconFolder, IconUser, IconLogout, IconChevronDown,
  IconSun, IconMoon, IconDeviceDesktop,
} from "@tabler/icons-react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useAuthLogout } from "@/api/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { href: "/dashboard",          label: "Tổng quan", icon: IconLayoutDashboard },
  { href: "/dashboard/notes",    label: "Ghi chú",   icon: IconNotes },
  { href: "/dashboard/tasks",    label: "Việc",      icon: IconCheckbox },
  { href: "/dashboard/snippets", label: "Code",      icon: IconCode },
  { href: "/dashboard/folders",  label: "Thư mục",   icon: IconFolder },
];

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { colorScheme, setColorScheme } = useUIStore();
  const isMobile = useIsMobile();

  const { mutate: logoutApi, isPending: isLoggingOut } = useAuthLogout({
    mutation: {
      onSettled: () => {
        queryClient.clear();
        logout();
        router.replace("/login");
      },
    },
  });

  const initials =
    user?.name?.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase() ?? "?";
  const avatarSrc = user?.avatar ?? undefined;

  const schemeIcons = {
    light: <IconSun size={16} />,
    dark: <IconMoon size={16} />,
    auto: <IconDeviceDesktop size={16} />,
  };
  const nextScheme =
    colorScheme === "light" ? "dark" : colorScheme === "dark" ? "auto" : "light";
  const schemeLabel = { light: "Sáng", dark: "Tối", auto: "Tự động" };

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 220,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      // Trên mobile thêm padding bottom cho bottom nav
      padding={{ base: "sm", sm: "md" }}
      styles={{
        main: {
          paddingBottom: isMobile ? "calc(var(--app-shell-padding) + 60px)" : undefined,
        },
      }}
    >
      {/* ── Header ── */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs">
              <ThemeIcon size={30} radius="md" variant="filled" color="violet">
                <IconBolt size={16} />
              </ThemeIcon>
              <Text fw={700} size="md" visibleFrom="xs">
                LifeOS
              </Text>
            </Group>
          </Group>

          <Group gap="xs">
            <Tooltip label={`Chế độ: ${schemeLabel[colorScheme]}`} position="bottom">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                onClick={() => setColorScheme(nextScheme)}
                aria-label="Toggle color scheme"
              >
                {schemeIcons[colorScheme]}
              </ActionIcon>
            </Tooltip>

            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <Avatar
                      src={avatarSrc}
                      size={30}
                      radius="xl"
                      color="violet"
                      variant={avatarSrc ? "transparent" : "filled"}
                    >
                      {!avatarSrc && initials}
                    </Avatar>
                    <Text size="sm" fw={500} lineClamp={1} visibleFrom="sm">
                      {user?.name ?? "User"}
                    </Text>
                    <IconChevronDown size={13} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user?.email}</Menu.Label>
                <Menu.Item
                  leftSection={<IconUser size={14} />}
                  component={Link}
                  href="/dashboard/profile"
                  onClick={close}
                >
                  Hồ sơ
                </Menu.Item>
                <Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={14} />}
                  onClick={() => logoutApi()}
                  disabled={isLoggingOut}
                >
                  Đăng xuất
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* ── Sidebar (desktop) ── */}
      <AppShell.Navbar p="xs">
        <AppShell.Section grow component={ScrollArea}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(href);
              return (
                <NavLink
                  key={href}
                  component={Link}
                  href={href}
                  label={label}
                  leftSection={<Icon size={17} />}
                  active={active}
                  variant="filled"
                  style={{ borderRadius: 8 }}
                  onClick={close}
                />
              );
            })}
          </div>
        </AppShell.Section>

        <AppShell.Section>
          <Divider mb="xs" />
          <NavLink
            component={Link}
            href="/dashboard/profile"
            label={user?.name ?? "Hồ sơ"}
            description={user?.email}
            leftSection={
              <Avatar
                src={avatarSrc}
                size={26}
                radius="xl"
                color="violet"
                variant={avatarSrc ? "transparent" : "filled"}
              >
                {!avatarSrc && initials}
              </Avatar>
            }
            active={pathname === "/dashboard/profile"}
            variant="filled"
            style={{ borderRadius: 8 }}
            onClick={close}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      {/* ── Main ── */}
      <AppShell.Main>{children}</AppShell.Main>

      {/* ── Bottom nav (mobile only) ── */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            background: "var(--mantine-color-body)",
            borderTop: "1px solid var(--mantine-color-default-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            zIndex: 200,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  padding: "6px 12px",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: active
                    ? "var(--mantine-color-violet-6)"
                    : "var(--mantine-color-dimmed)",
                  transition: "color 0.15s",
                }}
              >
                <Icon size={22} />
                <Text size="xs" fw={active ? 600 : 400} style={{ fontSize: 10 }}>
                  {label}
                </Text>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
