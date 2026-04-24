-- Optional course-level PDF (e.g. syllabus) separate from module resources.
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "handoutPdfUrl" TEXT;
