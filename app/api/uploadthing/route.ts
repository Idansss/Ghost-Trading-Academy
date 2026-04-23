import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// AUDIT FIX: All authenticated API routes must opt out of static rendering
export const dynamic = "force-dynamic";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
