import { Group, Title, Text, Button } from "@mantine/core";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <Group justify="space-between" align="flex-start" mb="lg" wrap="wrap" gap="sm">
      <div>
        <Title order={3}>{title}</Title>
        {description && (
          <Text size="sm" c="dimmed" mt={2}>
            {description}
          </Text>
        )}
      </div>
      {action && (
        <Button leftSection={action.icon} onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </Group>
  );
}
