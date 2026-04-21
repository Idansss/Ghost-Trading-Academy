import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  pdfUploader: f({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();

      if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, key: file.key, name: file.name };
    }),

  thumbnailUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();

      if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
