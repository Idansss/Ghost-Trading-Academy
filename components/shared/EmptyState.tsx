import { Inbox } from "lucide-react";
import { EmptyState as BaseEmptyState } from "@/components/ui/EmptyState";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <BaseEmptyState
      icon={<Inbox />}
      title={title}
      description={description}
      action={action}
    />
  );
}
