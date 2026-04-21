import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function VerdictCard({ rrRatio }: { rrRatio: number }) {
  if (rrRatio >= 2) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 p-6">
          <CheckCircle2 className="mt-1 h-5 w-5 text-[color:var(--color-green)]" />
          <div>
            <p className="font-semibold">Good risk management</p>
            <p className="text-sm text-muted-foreground">
              This trade is acceptable based on the current R:R.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rrRatio >= 1) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 p-6">
          <AlertTriangle className="mt-1 h-5 w-5 text-amber-500" />
          <div>
            <p className="font-semibold">Acceptable but not ideal</p>
            <p className="text-sm text-muted-foreground">
              Consider adjusting the take profit for at least 2R.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-6">
        <XCircle className="mt-1 h-5 w-5 text-[color:var(--color-red)]" />
        <div>
          <p className="font-semibold">Poor R:R</p>
          <p className="text-sm text-muted-foreground">
            Do not take this trade with the current structure.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
