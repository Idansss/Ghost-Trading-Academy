import { Button } from "@/components/ui/button";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="surface-card flex min-h-[280px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-muted-foreground [&_svg]:h-12 [&_svg]:w-12">{icon}</div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? (
        <Button type="button" variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
