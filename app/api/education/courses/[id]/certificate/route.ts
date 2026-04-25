import { renderToBuffer } from "@react-pdf/renderer";
import { format } from "date-fns";
import React from "react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CourseCertificate } from "@/lib/reports/CourseCertificate";
import { apiError } from "@/lib/utils";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const resolvedParams = await params;
    const [course, enrollment, siteConfig] = await Promise.all([
      prisma.course.findUnique({
        where: { id: resolvedParams.id },
      }),
      prisma.courseEnrollment.findUnique({
        where: {
          courseId_userId: {
            courseId: resolvedParams.id,
            userId: user.id,
          },
        },
      }),
      prisma.siteConfig.findUnique({ where: { id: "main" } }),
    ]);

    if (!course || !enrollment || !enrollment.completedAt) {
      return apiError("Certificate is available after course completion.", 400);
    }

    const pdf = await renderToBuffer(
      React.createElement(CourseCertificate, {
        platformName: siteConfig?.platformName ?? "The Thesis Desk",
        memberName: user.name ?? "Member",
        courseName: course.title,
        completionDate: format(enrollment.completedAt, "MMMM d, yyyy"),
      }) as React.ReactElement,
    );

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${course.title.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized.", 401);
    }
    return apiError("Unable to generate certificate.", 500);
  }
}
