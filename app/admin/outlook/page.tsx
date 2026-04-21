"use client";

import { OutlookForm } from "@/components/admin/OutlookForm";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutlook, useOutlookMutations } from "@/hooks/useOutlook";

export default function AdminOutlookPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, isLoading, isError, refetch } = useOutlook(today);
  const mutation = useOutlookMutations();

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Outlook"
        title="Post Daily Outlook"
        description="Publish the market bias, watchlist, levels, and what the desk should avoid."
      />

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Outlook</CardTitle>
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
            />
          )}
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}
