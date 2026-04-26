"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberResponseForm } from "@/components/outlook/MemberResponseForm";
import { useOutlookResponses } from "@/hooks/useOutlookResponses";
import type { MarketBias, ResponseWithMember } from "@/hooks/useOutlookResponses";

const badgeVariant: Record<MarketBias, "success" | "danger" | "warning" | "muted"> = {
  BULLISH: "success",
  BEARISH: "danger",
  RANGING: "warning",
  NEUTRAL: "muted",
};

function BiasSummary({ responses }: { responses: ResponseWithMember[] }) {
  const counts = responses.reduce<Record<string, number>>((acc, r) => {
    acc[r.memberBias] = (acc[r.memberBias] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(counts) as [MarketBias, number][]).map(([bias, count]) => (
        <Badge key={bias} variant={badgeVariant[bias]}>
          {bias} · {count}
        </Badge>
      ))}
    </div>
  );
}

function ResponseCard({ response }: { response: ResponseWithMember }) {
  const [expanded, setExpanded] = useState(false);
  const initial = response.member.name?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {response.member.avatarUrl ? (
            <Image
              src={response.member.avatarUrl}
              alt={response.member.name ?? "Member"}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
              {initial}
            </div>
          )}
          <span className="text-sm font-medium">{response.member.name ?? "Member"}</span>
        </div>
        <Badge variant={badgeVariant[response.memberBias]}>{response.memberBias}</Badge>
      </div>

      {response.note && (
        <p className="text-sm text-muted-foreground">{response.note}</p>
      )}

      {response.chartImageUrl && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left"
        >
          <div className={`relative overflow-hidden rounded-xl border border-border transition-all ${expanded ? "h-64" : "h-24"}`}>
            <Image
              src={response.chartImageUrl}
              alt="Member chart"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {!expanded && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent p-2">
                <span className="text-xs text-white">Tap to expand chart</span>
              </div>
            )}
          </div>
        </button>
      )}
    </div>
  );
}

export function MemberResponses({
  outlookId,
  currentUserId,
}: {
  outlookId: string;
  currentUserId: string;
}) {
  const { data, isLoading } = useOutlookResponses(outlookId);
  const responses = data?.responses ?? [];
  const myResponse = responses.find((r) => r.userId === currentUserId) ?? null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Desk Views</CardTitle>
          {responses.length > 0 && <BiasSummary responses={responses} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium">
            {myResponse ? "Your view" : "Share your view"}
          </p>
          <MemberResponseForm
            outlookId={outlookId}
            existing={myResponse}
            onRemove={() => {}}
          />
        </div>

        {responses.filter((r) => r.userId !== currentUserId).length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {responses.length - (myResponse ? 1 : 0)} other{" "}
              {responses.length - (myResponse ? 1 : 0) === 1 ? "view" : "views"}
            </p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-3">
                {responses
                  .filter((r) => r.userId !== currentUserId)
                  .map((r) => (
                    <ResponseCard key={r.id} response={r} />
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
