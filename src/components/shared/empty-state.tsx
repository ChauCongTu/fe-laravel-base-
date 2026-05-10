import { Stack, Text, ThemeIcon, Button } from "@mantine/core";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Stack align="center" gap="md" py={60}>
      <ThemeIcon size={64} radius="xl" variant="light" color="violet">
        {icon}
      </ThemeIcon>
      <div className="text-center">
        <Text fw={600} size="lg">{title}</Text>
        <Text size="sm" c="dimmed" mt={4} maw={320} ta="center">
          {description}
        </Text>
      </div>
      {action && (
        <Button variant="light" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Stack>
  );
}
