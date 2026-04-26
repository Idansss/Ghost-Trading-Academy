"use client";

import { useState } from "react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOutlookResponseMutations } from "@/hooks/useOutlookResponses";
import type { MarketBias, ResponseWithMember } from "@/hooks/useOutlookResponses";

const BIASES: MarketBias[] = ["BULLISH", "BEARISH", "NEUTRAL", "RANGING"];

const biasStyles: Record<MarketBias, string> = {
  BULLISH: "border-[color:var(--color-green)] bg-[color:var(--color-green-light)] text-[color:var(--color-green)]",
  BEARISH: "border-[color:var(--color-red)] bg-[color:var(--color-red-light)] text-[color:var(--color-red)]",
  NEUTRAL: "border-border bg-muted/50 text-muted-foreground",
  RANGING: "border-amber-500 bg-amber-500/10 text-amber-600",
};

export function MemberResponseForm({
  outlookId,
  existing,
  onRemove,
}: {
  outlookId: string;
  existing?: ResponseWithMember | null;
  onRemove: () => void;
}) {
  const [bias, setBias] = useState<MarketBias | null>(existing?.memberBias ?? null);
  const [note, setNote] = useState(existing?.note ?? "");
  const [chartImageUrl, setChartImageUrl] = useState(existing?.chartImageUrl ?? "");
  const { submit, remove } = useOutlookResponseMutations(outlookId);

  const handleSubmit = () => {
    if (!bias) return;
    submit.mutate({
      memberBias: bias,
      note: note || null,
      chartImageUrl: chartImageUrl || null,
    });
  };

  const handleRemove = () => {
    remove.mutate(undefined, { onSuccess: onRemove });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Your market bias</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BIASES.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBias(b)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                bias === b
                  ? biasStyles[b]
                  : "border-border bg-muted/20 text-muted-foreground hover:border-primary/30"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Your view (optional)</p>
        <Textarea
          placeholder="Share your reasoning, key levels you're watching..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          className="resize-none"
          rows={3}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{note.length}/500</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Your chart (optional)</p>
        <ImageUploadField
          imageUrl={chartImageUrl || null}
          onUpload={setChartImageUrl}
          onRemove={() => setChartImageUrl("")}
          title="Upload your chart"
          description="Share your chart analysis with the desk."
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSubmit}
          disabled={!bias || submit.isPending}
          size="sm"
        >
          {submit.isPending ? "Posting..." : existing ? "Update View" : "Post View"}
        </Button>
        {existing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={remove.isPending}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
