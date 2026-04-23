import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
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
        // AUDIT FIX: UploadThing auth failures must throw UploadThingError so
        // the client receives a proper UploadThing response instead of a 500.
        throw new UploadThingError("Unauthorized");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, key: file.key, name: file.name };
    }),

  avatarUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();

      if (!session?.user) {
        // AUDIT FIX: UploadThing auth failures must throw UploadThingError so
        // the client receives a proper UploadThing response instead of a 500.
        throw new UploadThingError("Unauthorized");
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
        // AUDIT FIX: UploadThing auth failures must throw UploadThingError so
        // the client receives a proper UploadThing response instead of a 500.
        throw new UploadThingError("Unauthorized");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, key: file.key };
    }),

  tradeChart: f({
    "image/jpeg": {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
    "image/png": {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
    "image/webp": {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();

      if (!session?.user) {
        // AUDIT FIX: UploadThing auth failures must throw UploadThingError so
        // the client receives a proper UploadThing response instead of a 500.
        throw new UploadThingError("Unauthorized");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, key: file.key, name: file.name };
    }),
  imageUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) {
        throw new UploadThingError("Unauthorized");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, key: file.key, name: file.name };
    }),

  chatImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();
      // AUDIT FIX: Chat uploads now fail with UploadThingError("Unauthorized")
      // instead of silently proceeding or throwing a generic Error.
      if (!session?.user) {
        throw new UploadThingError("Unauthorized");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // AUDIT FIX: The chat upload completion payload now returns { url, userId }
      // so the client can correlate uploads without a follow-up fetch.
      return { url: file.url, userId: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
