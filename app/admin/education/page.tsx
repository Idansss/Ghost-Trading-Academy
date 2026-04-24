"use client";

import { EducationBuilder } from "@/components/admin/EducationBuilder";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AdminEducationPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin"
          title="Education Builder"
          description="Create courses, add modules, assign resources, and attach quizzes."
        />

        <EducationBuilder />
      </div>
    </PageTransition>
  );
}
