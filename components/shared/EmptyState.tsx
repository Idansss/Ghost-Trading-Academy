import { Inbox } from "lucide-react";
import { EmptyState as BaseEmptyState } from "@/components/ui/EmptyState";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <BaseEmptyState
      icon={<Inbox />}
      title={title}
      description={description}
    />
  );
}
