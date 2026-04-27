"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, FileText, Plus, Settings2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { EducationBuilder } from "@/components/admin/EducationBuilder";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { EducationSkeleton } from "@/components/skeletons/EducationSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResourceCard } from "@/components/education/ResourceCard";
import { fetchJson } from "@/lib/client-api";

type EducationCourse = {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  handoutPdfUrl: string | null;
  progress: {
    completedModules: number;
    totalModules: number;
    percent: number;
  };
  enrollment: { completedAt: string | null } | null;
  modules: Array<{
    id: string;
    title: string;
    resources: Array<{
      id: string;
      title: string;
      description: string;
      type: "PDF" | "VIDEO" | "GUIDE";
      url: string;
      tag: string;
      meta: string;
      completedByMe?: boolean;
    }>;
    quiz: {
      id: string;
      questions: Array<{
        id: string;
        question: string;
        options: string[];
      }>;
    } | null;
    stats: {
      resourceCount: number;
      completedResourceCount: number;
      quizPassed: boolean;
      bestQuizScore: number | null;
    };
  }>;
};

type CoursesResponse = { courses: EducationCourse[] };

export default function EducationPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Record<number, number>>>({});
  const isAdmin = session?.user.role === "ADMIN";
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["education-courses"],
    queryFn: () => fetchJson<CoursesResponse>("/api/education/courses"),
  });

  // CLAUDE FIX: Mark course complete when user opens the course-level handout PDF
  const openPdfMutation = useMutation({
    mutationFn: (courseId: string) =>
      fetchJson(`/api/education/courses/${courseId}/complete`, { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["education-courses"] });
    },
  });

  const quizMutation = useMutation({
    mutationFn: (payload: { moduleId: string; answers: number[] }) =>
      fetchJson(`/api/education/modules/${payload.moduleId}/quiz-attempt`, {
        method: "POST",
        body: JSON.stringify({ answers: payload.answers }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["education-courses"] });
    },
  });

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Education"
          title="Courses & Modules"
          description="Complete structured courses, pass quizzes, and download completion certificates."
          action={
            isAdmin ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => scrollToSection("education-admin-desk")}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Manage Courses
                </Button>
                <Button onClick={() => scrollToSection("education-course-create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </Button>
              </div>
            ) : null
          }
        />

        {isAdmin ? <EducationBuilder /> : null}

        {isLoading ? (
          <EducationSkeleton />
        ) : isError ? (
          <ErrorState
            title="Education unavailable"
            description="There was a problem loading your courses."
            onRetry={() => {
              void refetch();
            }}
          />
        ) : data?.courses.length ? (
          <div className="space-y-5">
            {data.courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {course.coverImage ? (
                      <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl border border-border sm:h-28 sm:w-44">
                        <Image
                          src={course.coverImage}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 11rem"
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-2">
                      <CardTitle>{course.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                    </div>
                  </div>
                  {course.handoutPdfUrl ? (
                    <div>
                      {/* CLAUDE FIX: Opens PDF and marks the course complete so the
                          progress bar updates from "0 of 0 modules" to "1 of 1 100%" */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(course.handoutPdfUrl!, "_blank", "noopener,noreferrer");
                          if (!course.enrollment?.completedAt) {
                            openPdfMutation.mutate(course.id);
                          }
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Open course PDF
                      </Button>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    {/* CLAUDE FIX: Courses with no modules but a handout PDF treat the
                        PDF as a single-module resource — show 100% once opened */}
                    {(() => {
                      const total = course.progress.totalModules > 0 ? course.progress.totalModules : 1;
                      const completed = course.progress.totalModules > 0
                        ? course.progress.completedModules
                        : (course.enrollment?.completedAt ? 1 : 0);
                      const pct = course.progress.totalModules > 0
                        ? course.progress.percent
                        : (course.enrollment?.completedAt ? 100 : 0);
                      return (
                        <>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{completed} of {total} modules completed</span>
                            <span>{pct}%</span>
                          </div>
                          <Progress value={pct} />
                        </>
                      );
                    })()}</div>
                  {course.enrollment?.completedAt ? (
                    <div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/api/education/courses/${course.id}/certificate`} target="_blank">
                          Download Certificate
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.modules.map((module) => (
                    <div key={module.id} className="rounded-2xl border border-border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-medium">{module.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {module.stats.completedResourceCount}/{module.stats.resourceCount} resources
                        </p>
                      </div>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {module.resources.map((resource) => (
                          <ResourceCard key={resource.id} resource={resource as never} />
                        ))}
                      </div>

                      {module.quiz ? (
                        <div className="mt-4 rounded-xl border border-border bg-card/50 p-3">
                          <p className="mb-2 text-sm font-medium">
                            Module Quiz {module.stats.quizPassed ? "(Passed)" : ""}
                          </p>
                          <div className="space-y-3">
                            {module.quiz.questions.map((question, questionIndex) => (
                              <div key={question.id} className="space-y-1">
                                <p className="text-sm">{question.question}</p>
                                <div className="flex flex-wrap gap-2">
                                  {question.options.map((option, optionIndex) => (
                                    <button
                                      key={`${question.id}-${optionIndex}`}
                                      type="button"
                                      className={`rounded-lg border px-2 py-1 text-xs ${
                                        quizAnswers[module.id]?.[questionIndex] === optionIndex
                                          ? "border-primary bg-primary/10"
                                          : "border-border"
                                      }`}
                                      onClick={() => {
                                        setQuizAnswers((previous) => ({
                                          ...previous,
                                          [module.id]: {
                                            ...(previous[module.id] ?? {}),
                                            [questionIndex]: optionIndex,
                                          },
                                        }));
                                      }}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Best score: {module.stats.bestQuizScore ?? 0}% (Pass mark: 70%)
                          </p>
                          <Button
                            className="mt-3"
                            size="sm"
                            disabled={quizMutation.isPending}
                            onClick={() => {
                              const answers = module.quiz!.questions.map(
                                (_question, index) => quizAnswers[module.id]?.[index] ?? -1,
                              );
                              quizMutation.mutate({ moduleId: module.id, answers });
                            }}
                          >
                            Submit Quiz
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen />}
            title="No courses yet"
            description="Courses will appear here once published."
            action={
              isAdmin
                ? {
                    label: "Create first course",
                    onClick: () => scrollToSection("education-course-create"),
                  }
                : undefined
            }
          />
        )}
      </div>
    </PageTransition>
  );
}
