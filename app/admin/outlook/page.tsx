"use client";

import { OutlookEditor } from "@/components/admin/OutlookEditor";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AdminOutlookPage() {
  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Outlook"
        title="Post Daily Outlook"
        description="Publish the market bias, watchlist, levels, and what the desk should avoid."
      />

      <OutlookEditor title="Today's Outlook" />
    </div>
    </PageTransition>
  );
}
