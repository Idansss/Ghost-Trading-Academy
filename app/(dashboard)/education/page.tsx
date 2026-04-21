"use client";

import type { Resource } from "@prisma/client";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResourceCard } from "@/components/education/ResourceCard";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { VipGate } from "@/components/shared/VipGate";
import { EducationSkeleton } from "@/components/skeletons/EducationSkeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ResourceFilters } from "@/components/education/ResourceFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { fetchJson } from "@/lib/client-api";

export default function EducationPage() {
  const [filter, setFilter] = useState("ALL");
  const { data: session } = useSession();
  const isMember = session?.user.role === "MEMBER";
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["resources"],
    queryFn: () => fetchJson<{ resources: Resource[] }>("/api/resources"),
  });
  const resources = useMemo(
    () =>
      data?.resources.filter((resource) => filter === "ALL" || resource.type === filter) ??
      [],
    [data?.resources, filter],
  );
  const visibleResources = useMemo(
    () => resources.filter((resource) => !isMember || !resource.isVipOnly),
    [isMember, resources],
  );
  const lockedPreviewCount = isMember
    ? Math.max(
        2,
        resources.filter((resource) => resource.isVipOnly).length || 0,
      )
    : 0;

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Education"
        title="Education Hub"
        description="Structured training materials covering risk, psychology, live walkthroughs, and pattern study."
      />
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
      ) : visibleResources.length || lockedPreviewCount ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {visibleResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ResourceCard resource={resource} />
            </motion.div>
          ))}
          {Array.from({ length: lockedPreviewCount }).map((_, index) => (
            <motion.div
              key={`locked-resource-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (visibleResources.length + index) * 0.05 }}
            >
              <VipGate
                enabled
                variant="card"
                description="Unlock the PDF, video link, and desk notes."
              >
                <Card className="transition-all hover:border-primary/40">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={index % 2 === 0 ? "danger" : "info"}>
                        {index % 2 === 0 ? "PDF" : "VIDEO"}
                      </Badge>
                      <Badge variant="muted">VIP</Badge>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Premium resource</h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        VIP strategy notes, walkthroughs, and advanced execution material.
                      </p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Locked content
                    </p>
                    <div className="h-11 rounded-2xl bg-muted/60" />
                  </CardContent>
                </Card>
              </VipGate>
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
