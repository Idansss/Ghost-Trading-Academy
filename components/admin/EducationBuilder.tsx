"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ExternalLink, FileText, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PdfUploadButton } from "@/components/admin/PdfUploadButton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/client-api";

type UploadedPdf = {
  url: string;
  key: string;
  name: string;
};

type ModuleResource = {
  id: string;
  title: string;
  description: string;
  type: "PDF" | "VIDEO" | "GUIDE";
  url: string;
  tag: string;
  meta: string;
  isVipOnly: boolean;
  fileKey: string | null;
};

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
      resources: ModuleResource[];
      quiz: { id: string; questions: Array<{ id: string; question: string }> } | null;
    }>;
  }>;
};

const resourceTags = ["Foundation", "Strategy", "Psychology", "Risk", "Recap"] as const;

function CourseEditor({
  course,
  onSave,
  onDelete,
  onAddModule,
  onSaveModule,
  onDeleteModule,
  onCreateResource,
  onDeleteResource,
  isSavingCourse,
  isDeletingCourse,
  isCreatingModule,
  isSavingModule,
  isDeletingModule,
  isCreatingResource,
  isDeletingResource,
}: {
  course: AdminEducationData["courses"][number];
  onSave: (payload: {
    id: string;
    title: string;
    description: string;
    isPublished: boolean;
  }) => void;
  onDelete: (courseId: string) => void;
  onAddModule: (payload: { courseId: string; nextModuleNumber: number }) => void;
  onSaveModule: (payload: { moduleId: string; title: string }) => void;
  onDeleteModule: (moduleId: string) => void;
  onCreateResource: (payload: {
    moduleId: string;
    title: string;
    description: string;
    tag: string;
    isVipOnly: boolean;
    file: UploadedPdf;
  }) => Promise<void>;
  onDeleteResource: (resourceId: string) => void;
  isSavingCourse: boolean;
  isDeletingCourse: boolean;
  isCreatingModule: boolean;
  isSavingModule: (moduleId: string) => boolean;
  isDeletingModule: (moduleId: string) => boolean;
  isCreatingResource: (moduleId: string) => boolean;
  isDeletingResource: (resourceId: string) => boolean;
}) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [isPublished, setIsPublished] = useState(course.isPublished);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>{course.title}</CardTitle>
            <CardDescription>
              Manage the course shell, publish state, and module lineup from the live education page.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                onAddModule({ courseId: course.id, nextModuleNumber: course.modules.length + 1 })
              }
              disabled={isCreatingModule}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDelete(course.id)}
              disabled={isDeletingCourse}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Course
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
          <div className="space-y-2">
            <Label htmlFor={`course-title-${course.id}`}>Course title</Label>
            <Input
              id={`course-title-${course.id}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="rounded-2xl border border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-xs text-muted-foreground">
                  Control whether members can see this course.
                </p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`course-description-${course.id}`}>Course description</Label>
          <Textarea
            id={`course-description-${course.id}`}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() =>
              onSave({
                id: course.id,
                title,
                description,
                isPublished,
              })
            }
            disabled={isSavingCourse || !title.trim() || !description.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSavingCourse ? "Saving..." : "Save Course"}
          </Button>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Modules</h3>
            <p className="text-sm text-muted-foreground">
              Add new modules, rename existing ones, upload PDF resources, and prune empty placeholders.
            </p>
          </div>

          {course.modules.length ? (
            <div className="space-y-3">
              {course.modules.map((module) => (
                <ModuleEditor
                  key={module.id}
                  module={module}
                  onSave={onSaveModule}
                  onDelete={onDeleteModule}
                  onCreateResource={onCreateResource}
                  onDeleteResource={onDeleteResource}
                  isSaving={isSavingModule(module.id)}
                  isDeleting={isDeletingModule(module.id)}
                  isCreatingResource={isCreatingResource(module.id)}
                  isDeletingResource={isDeletingResource}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              No modules yet. Add the first module to start structuring this course.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleEditor({
  module,
  onSave,
  onDelete,
  onCreateResource,
  onDeleteResource,
  isSaving,
  isDeleting,
  isCreatingResource,
  isDeletingResource,
}: {
  module: AdminEducationData["courses"][number]["modules"][number];
  onSave: (payload: { moduleId: string; title: string }) => void;
  onDelete: (moduleId: string) => void;
  onCreateResource: (payload: {
    moduleId: string;
    title: string;
    description: string;
    tag: string;
    isVipOnly: boolean;
    file: UploadedPdf;
  }) => Promise<void>;
  onDeleteResource: (resourceId: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
  isCreatingResource: boolean;
  isDeletingResource: (resourceId: string) => boolean;
}) {
  const [title, setTitle] = useState(module.title);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceDescription, setResourceDescription] = useState("");
  const [resourceTag, setResourceTag] = useState<(typeof resourceTags)[number]>("Foundation");
  const [resourceIsVipOnly, setResourceIsVipOnly] = useState(true);
  const [uploadedPdf, setUploadedPdf] = useState<UploadedPdf | null>(null);

  const resetResourceDraft = () => {
    setResourceTitle("");
    setResourceDescription("");
    setResourceTag("Foundation");
    setResourceIsVipOnly(true);
    setUploadedPdf(null);
  };

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor={`module-title-${module.id}`}>Module title</Label>
          <Input
            id={`module-title-${module.id}`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Resources: {module.resources.length || "None"}</p>
            <p>Quiz questions: {module.quiz?.questions.length ?? 0}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button
            variant="outline"
            onClick={() => onSave({ moduleId: module.id, title })}
            disabled={isSaving || !title.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button variant="destructive" onClick={() => onDelete(module.id)} disabled={isDeleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-4 border-t border-border pt-6">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Module PDFs</h4>
          <p className="text-sm text-muted-foreground">
            Upload lesson PDFs directly into this module without leaving the education page.
          </p>
        </div>

        {module.resources.length ? (
          <div className="space-y-3">
            {module.resources.map((resource) => (
              <div
                key={resource.id}
                className="flex flex-col gap-3 rounded-2xl border border-border p-4 lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={resource.type === "PDF" ? "danger" : "info"}>
                      {resource.type}
                    </Badge>
                    <Badge variant="muted">{resource.tag}</Badge>
                    <Badge variant={resource.isVipOnly ? "default" : "muted"}>
                      {resource.isVipOnly ? "VIP" : "Public"}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">{resource.title}</p>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {resource.meta}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild type="button" variant="outline" size="sm">
                    <a href={resource.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isDeletingResource(resource.id)}
                    onClick={() => onDeleteResource(resource.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeletingResource(resource.id) ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No resources attached yet. Upload the first PDF for this module below.
          </div>
        )}

        <div className="rounded-2xl border border-border bg-muted/10 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`resource-title-${module.id}`}>PDF title</Label>
              <Input
                id={`resource-title-${module.id}`}
                placeholder="Weekly market structure playbook"
                value={resourceTitle}
                onChange={(event) => setResourceTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tag</Label>
              <Select value={resourceTag} onValueChange={(value) => setResourceTag(value as (typeof resourceTags)[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resourceTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`resource-description-${module.id}`}>Description</Label>
              <Textarea
                id={`resource-description-${module.id}`}
                rows={3}
                placeholder="What members should learn from this PDF."
                value={resourceDescription}
                onChange={(event) => setResourceDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>PDF upload</Label>
              <PdfUploadButton
                value={uploadedPdf}
                onUpload={(url, key, name) => {
                  setUploadedPdf({ url, key, name });
                }}
                onClear={() => {
                  setUploadedPdf(null);
                }}
              />
            </div>
            <div className="rounded-2xl border border-border px-4 py-3 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">VIP only</p>
                  <p className="text-xs text-muted-foreground">
                    Restrict this PDF to VIP members only.
                  </p>
                </div>
                <Switch checked={resourceIsVipOnly} onCheckedChange={setResourceIsVipOnly} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              disabled={
                isCreatingResource ||
                !resourceTitle.trim() ||
                !resourceDescription.trim() ||
                !uploadedPdf
              }
              onClick={async () => {
                if (!uploadedPdf) {
                  return;
                }

                try {
                  await onCreateResource({
                    moduleId: module.id,
                    title: resourceTitle,
                    description: resourceDescription,
                    tag: resourceTag,
                    isVipOnly: resourceIsVipOnly,
                    file: uploadedPdf,
                  });
                  resetResourceDraft();
                } catch {
                  // Mutation-level toast already explains the failure.
                }
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              {isCreatingResource ? "Attaching PDF..." : "Attach PDF To Module"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EducationBuilder() {
  const queryClient = useQueryClient();
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  const query = useQuery({
    queryKey: ["admin-education"],
    queryFn: () => fetchJson<AdminEducationData>("/api/admin/education/courses"),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-education"] });
    await queryClient.invalidateQueries({ queryKey: ["education-courses"] });
    await queryClient.invalidateQueries({ queryKey: ["resources"] });
  };

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
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateCourse = useMutation({
    mutationFn: (payload: {
      id: string;
      title: string;
      description: string;
      isPublished: boolean;
    }) =>
      fetchJson(`/api/admin/education/courses/${payload.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          isPublished: payload.isPublished,
        }),
      }),
    onSuccess: async () => {
      toast.success("Course updated.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteCourse = useMutation({
    mutationFn: (courseId: string) =>
      fetchJson(`/api/admin/education/courses/${courseId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      toast.success("Course deleted.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createModule = useMutation({
    mutationFn: (payload: { courseId: string; title: string }) =>
      fetchJson("/api/admin/education/modules", {
        method: "POST",
        body: JSON.stringify({
          courseId: payload.courseId,
          title: payload.title,
          resourceIds: [],
          quizQuestions: [],
        }),
      }),
    onSuccess: async () => {
      toast.success("Module created.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateModule = useMutation({
    mutationFn: (payload: { moduleId: string; title: string }) =>
      fetchJson("/api/admin/education/modules", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      toast.success("Module updated.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteModule = useMutation({
    mutationFn: (moduleId: string) =>
      fetchJson("/api/admin/education/modules", {
        method: "DELETE",
        body: JSON.stringify({ moduleId }),
      }),
    onSuccess: async () => {
      toast.success("Module deleted.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createResource = useMutation({
    mutationFn: (payload: {
      moduleId: string;
      title: string;
      description: string;
      tag: string;
      isVipOnly: boolean;
      file: UploadedPdf;
    }) =>
      fetchJson("/api/resources", {
        method: "POST",
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          type: "PDF",
          url: payload.file.url,
          fileKey: payload.file.key,
          tag: payload.tag,
          isVipOnly: payload.isVipOnly,
          meta: payload.file.name,
          moduleId: payload.moduleId,
        }),
      }),
    onSuccess: async () => {
      toast.success("PDF attached to module.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteResource = useMutation({
    mutationFn: (resourceId: string) =>
      fetchJson(`/api/resources/${resourceId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      toast.success("Resource deleted.");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div id="education-admin-desk" className="space-y-6">
      <Card id="education-course-create">
        <CardHeader>
          <CardTitle>Admin Course Builder</CardTitle>
          <CardDescription>
            Create courses, publish them, and manage module structure without leaving the education page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-course-title">Course title</Label>
              <Input
                id="new-course-title"
                placeholder="Price Action Foundations"
                value={courseTitle}
                onChange={(event) => setCourseTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-course-description">Course description</Label>
              <Textarea
                id="new-course-description"
                rows={3}
                placeholder="What members will learn in this course."
                value={courseDescription}
                onChange={(event) => setCourseDescription(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              disabled={createCourse.isPending || !courseTitle.trim() || !courseDescription.trim()}
              onClick={() => createCourse.mutate()}
            >
              <Plus className="mr-2 h-4 w-4" />
              {createCourse.isPending ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-48 rounded-[28px] bg-muted/50" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          title="Education builder unavailable"
          description="There was a problem loading your admin course data."
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : query.data?.courses.length ? (
        <div className="space-y-4">
          {query.data.courses.map((course) => (
            <CourseEditor
              key={course.id}
              course={course}
              onSave={(payload) => updateCourse.mutate(payload)}
              onDelete={(courseId) => deleteCourse.mutate(courseId)}
              onAddModule={({ courseId, nextModuleNumber }) =>
                createModule.mutate({
                  courseId,
                  title: `Module ${nextModuleNumber}`,
                })
              }
              onSaveModule={(payload) => updateModule.mutate(payload)}
              onDeleteModule={(moduleId) => deleteModule.mutate(moduleId)}
              onCreateResource={async (payload) => {
                await createResource.mutateAsync(payload);
              }}
              onDeleteResource={(resourceId) => deleteResource.mutate(resourceId)}
              isSavingCourse={
                updateCourse.isPending && updateCourse.variables?.id === course.id
              }
              isDeletingCourse={
                deleteCourse.isPending && deleteCourse.variables === course.id
              }
              isCreatingModule={
                createModule.isPending && createModule.variables?.courseId === course.id
              }
              isSavingModule={(moduleId) =>
                updateModule.isPending && updateModule.variables?.moduleId === moduleId
              }
              isDeletingModule={(moduleId) =>
                deleteModule.isPending && deleteModule.variables === moduleId
              }
              isCreatingResource={(moduleId) =>
                createResource.isPending && createResource.variables?.moduleId === moduleId
              }
              isDeletingResource={(resourceId) =>
                deleteResource.isPending && deleteResource.variables === resourceId
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen />}
          title="No courses created yet"
          description="Create the first course and it will appear here for further editing."
        />
      )}
    </div>
  );
}
