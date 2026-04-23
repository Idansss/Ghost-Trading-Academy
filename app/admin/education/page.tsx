"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/client-api";

type AdminEducationData = {
  courses: Array<{
    id: string;
    title: string;
    description: string;
    isPublished: boolean;
    order: number;
    modules: Array<{
      id: string;
      title: string;
      order: number;
      resources: Array<{ id: string; title: string }>;
      quiz: { id: string; questions: Array<{ id: string; question: string }> } | null;
    }>;
  }>;
  resources: Array<{ id: string; title: string }>;
};

export default function AdminEducationPage() {
  const queryClient = useQueryClient();
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  const query = useQuery({
    queryKey: ["admin-education"],
    queryFn: () => fetchJson<AdminEducationData>("/api/admin/education/courses"),
  });

  const createCourse = useMutation({
    mutationFn: () =>
      fetchJson("/api/admin/education/courses", {
        method: "POST",
        body: JSON.stringify({ title: courseTitle, description: courseDescription }),
      }),
    onSuccess: async () => {
      setCourseTitle("");
      setCourseDescription("");
      toast.success("Course created.");
      await queryClient.invalidateQueries({ queryKey: ["admin-education"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const moduleCreate = useMutation({
    mutationFn: (payload: {
      courseId: string;
      title: string;
      resourceIds: string[];
      quizQuestions: Array<{ question: string; options: string[]; correctIndex: number }>;
    }) =>
      fetchJson("/api/admin/education/modules", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Module created.");
      await queryClient.invalidateQueries({ queryKey: ["admin-education"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resourcesById = useMemo(
    () => new Map((query.data?.resources ?? []).map((resource) => [resource.id, resource])),
    [query.data?.resources],
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin"
          title="Education Builder"
          description="Create courses, add modules, assign resources, and attach quizzes."
        />

        <Card>
          <CardHeader>
            <CardTitle>Create Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Course title"
              value={courseTitle}
              onChange={(event) => setCourseTitle(event.target.value)}
            />
            <Input
              placeholder="Course description"
              value={courseDescription}
              onChange={(event) => setCourseDescription(event.target.value)}
            />
            <Button
              disabled={createCourse.isPending || !courseTitle || !courseDescription}
              onClick={() => createCourse.mutate()}
            >
              Create Course
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {(query.data?.courses ?? []).map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>
                  {course.title} ({course.modules.length} modules)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{course.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    moduleCreate.mutate({
                      courseId: course.id,
                      title: `Module ${course.modules.length + 1}`,
                      resourceIds: [],
                      quizQuestions: [],
                    })
                  }
                >
                  Add Module
                </Button>

                {course.modules.map((module) => (
                  <div key={module.id} className="rounded-xl border p-3">
                    <p className="font-medium">{module.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Resources: {module.resources.map((resource) => resourcesById.get(resource.id)?.title ?? resource.id).join(", ") || "None"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Quiz questions: {module.quiz?.questions.length ?? 0}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
