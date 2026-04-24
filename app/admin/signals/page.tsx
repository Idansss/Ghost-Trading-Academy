"use client";

import { SignalsDesk } from "@/components/admin/SignalsDesk";
import { PageTransition } from "@/components/layout/PageTransition";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AdminSignalsPage() {
  return (
    <PageTransition>
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Signals" }]} />
      <PageHeader
        eyebrow="Admin Signals"
        title="Publish And Manage Signals"
        description="Post new setups and update the lifecycle of active signals."
      />

      <SignalsDesk />
    </div>
    </PageTransition>
  );
}
