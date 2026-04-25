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
    <Card className="overflow-hidden">
      <CardHeader className="pb-2.5">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-2.5">
          <div>
            <p
              data-number="true"
              className={cn(
                "text-2xl font-semibold leading-none",
                tone === "positive" && "text-[color:var(--color-green)]",
                tone === "negative" && "text-[color:var(--color-red)]",
              )}
            >
              {value}
            </p>
            {helper ? (
              <p className="mt-1.5 text-xs text-muted-foreground">{helper}</p>
            ) : null}
          </div>
          <div
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
              tone === "positive" && "bg-[color:var(--color-green-light)] text-[color:var(--color-green)]",
              tone === "negative" && "bg-[color:var(--color-red-light)] text-[color:var(--color-red)]",
              tone === "neutral" && "bg-primary/10 text-primary",
            )}
          >
            {tone === "negative" ? (
              <ArrowDownRight className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
