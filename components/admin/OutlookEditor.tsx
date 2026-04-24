"use client";

import { OutlookForm } from "@/components/admin/OutlookForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutlook, useOutlookMutations } from "@/hooks/useOutlook";

export function OutlookEditor({
  title = "Today's Outlook",
  description = "Post or update the market bias, watchlist, levels, and risk notes for the live page.",
  redirectTo = "/admin",
}: {
  title?: string;
  description?: string;
  redirectTo?: string | null;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, isLoading, isError, refetch } = useOutlook(today);
  const mutation = useOutlookMutations();

  return (
    <Card id="outlook-admin-desk">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[520px] w-full rounded-3xl" />
        ) : isError ? (
          <ErrorState
            title="Outlook form unavailable"
            description="Today's outlook could not be loaded."
            onRetry={() => {
              void refetch();
            }}
          />
        ) : (
          <OutlookForm
            initialValues={
              data?.outlook
                ? {
                    marketBias: data.outlook.marketBias,
                    biasExplanation: data.outlook.biasExplanation,
                    chartImageUrl: data.outlook.chartImageUrl ?? "",
                    coinsToWatch: data.outlook.coinsToWatch as Array<{
                      coin: string;
                      note: string;
                    }>,
                    levels: data.outlook.levels as Array<{
                      coin: string;
                      resistance: string;
                      support: string;
                    }>,
                    avoidToday: data.outlook.avoidToday as string[],
                  }
                : null
            }
            onSubmit={async (values) => {
              await mutation.mutateAsync(values);
            }}
            isSubmitting={mutation.isPending}
            redirectTo={redirectTo}
          />
        )}
      </CardContent>
    </Card>
  );
}
