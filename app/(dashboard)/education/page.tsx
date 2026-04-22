"use client";

import type { Resource } from "@prisma/client";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ResourceCard } from "@/components/education/ResourceCard";
import { ResourceFilters } from "@/components/education/ResourceFilters";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { EducationSkeleton } from "@/components/skeletons/EducationSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Progress } from "@/components/ui/progress";
import { fetchJson } from "@/lib/client-api";

type ResourceWithCompletion = Resource & { completedByMe?: boolean };

type ResourcesResponse = {
  resources: ResourceWithCompletion[];
  completedCount: number;
  totalCount: number;
};

export default function EducationPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("ALL");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["resources"],
    queryFn: () => fetchJson<ResourcesResponse>("/api/resources"),
  });

  const resources = useMemo(
    () =>
      data?.resources.filter(
        (resource) => filter === "ALL" || resource.type === filter,
      ) ?? [],
    [data?.resources, filter],
  );

  const handleCompletionChange = useCallback(
    (resourceId: string, completed: boolean) => {
      queryClient.setQueryData<ResourcesResponse>(["resources"], (prev) => {
        if (!prev) return prev;
        const updatedResources = prev.resources.map((r) =>
          r.id === resourceId ? { ...r, completedByMe: completed } : r,
        );
        const completedCount = updatedResources.filter((r) => r.completedByMe).length;
        return { ...prev, resources: updatedResources, completedCount };
      });
    },
    [queryClient],
  );

  const completedCount = data?.completedCount ?? 0;
  const totalCount = data?.totalCount ?? 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Education"
          title="Education Hub"
          description="Structured training materials covering risk, psychology, live walkthroughs, and pattern study."
        />

        {totalCount > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Your progress</span>
              <span className="text-muted-foreground">
                {completedCount} of {totalCount} completed
              </span>
            </div>
            <Progress value={totalCount > 0 ? (completedCount / totalCount) * 100 : 0} />
          </div>
        )}

        <ResourceFilters value={filter} onValueChange={setFilter} />

        {isLoading ? (
          <EducationSkeleton />
        ) : isError ? (
          <ErrorState
            title="Education unavailable"
            description="There was a problem loading the education library."
            onRetry={() => {
              void refetch();
            }}
          />
        ) : resources.length ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ResourceCard
                  resource={resource}
                  onCompletionChange={handleCompletionChange}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen />}
            title="No resources yet"
            description="Educational materials will appear here once uploaded by the admin."
          />
        )}
      </div>
    </PageTransition>
  );
}
