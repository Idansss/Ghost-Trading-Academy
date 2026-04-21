import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  tone = "neutral",
  helper,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
  helper?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className={cn(
                "text-2xl font-semibold",
                tone === "positive" && "text-[color:var(--color-green)]",
                tone === "negative" && "text-[color:var(--color-red)]",
              )}
            >
              {value}
            </p>
            {helper ? (
              <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
            ) : null}
          </div>
          <div
            className={cn(
              "grid h-10 w-10 place-items-center rounded-2xl",
              tone === "positive" && "bg-[color:var(--color-green-light)] text-[color:var(--color-green)]",
              tone === "negative" && "bg-[color:var(--color-red-light)] text-[color:var(--color-red)]",
              tone === "neutral" && "bg-primary/10 text-primary",
            )}
          >
            {tone === "negative" ? (
              <ArrowDownRight className="h-4 w-4" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
