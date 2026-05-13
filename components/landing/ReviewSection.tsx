"use client";

import { FormEvent, useState } from "react";
import { Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type LandingReviewItem = {
  id: string;
  displayName: string;
  role: string;
  rating: number;
  message: string;
};

type ReviewSectionProps = {
  initialReviews: LandingReviewItem[];
};

type ReviewResponse = {
  success: boolean;
  data?: {
    review: LandingReviewItem;
  };
  error?: {
    message: string;
  };
};

export function ReviewSection({ initialReviews }: ReviewSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, message, rating }),
      });
      const payload = (await response.json()) as ReviewResponse;

      if (!response.ok || !payload.success || !payload.data?.review) {
        throw new Error(payload.error?.message ?? "Unable to submit review.");
      }

      const review = payload.data.review;
      setReviews((current) => [review, ...current]);
      setDisplayName("");
      setMessage("");
      setRating(5);
      setStatus("Review added.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="testimonials" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            What members are saying
          </h2>
          <p className="mt-3 text-muted-foreground">
            Results from real members who show up and do the work.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="surface-card mx-auto mt-14 grid max-w-3xl gap-5 rounded-3xl p-6 sm:p-8"
        >
          <div>
            <h3 className="text-lg font-semibold">Share your experience</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a quick review and rating for other traders to see.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="grid gap-2">
              <Label htmlFor="review-name">Name</Label>
              <Input
                id="review-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your name"
                minLength={2}
                maxLength={80}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Rating</Label>
              <div className="flex h-11 items-center gap-1" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={rating === value}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    onClick={() => setRating(value)}
                    className="rounded-xl p-1 text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Star
                      className={cn(
                        "h-6 w-6",
                        value <= rating ? "fill-current" : "fill-transparent opacity-45",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="review-message">Review</Label>
            <Textarea
              id="review-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write what changed for you after joining the desk."
              minLength={10}
              maxLength={500}
              required
            />
            <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>{status}</span>
              <span>{message.length}/500</span>
            </div>
          </div>

          <Button type="submit" className="justify-self-start" disabled={isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit review"}
          </Button>
        </form>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: LandingReviewItem }) {
  return (
    <div className="surface-card flex flex-col gap-4 rounded-2xl p-6">
      <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              "h-4 w-4 text-primary",
              index < review.rating ? "fill-current" : "fill-transparent opacity-35",
            )}
            aria-hidden
          />
        ))}
      </div>
      <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">
        &ldquo;{review.message}&rdquo;
      </blockquote>
      <div>
        <p className="text-sm font-semibold">{review.displayName}</p>
        <p className="text-xs text-muted-foreground">{review.role}</p>
      </div>
    </div>
  );
}
