import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Something went wrong",
  description = "There was a problem loading this data.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry: () => void;
}) {
  return (
    <div className="surface-card flex min-h-[280px] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertCircle className="h-12 w-12 text-[color:var(--color-red)]" />
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      <Button type="button" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
