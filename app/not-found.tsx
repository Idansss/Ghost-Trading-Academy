// CLAUDE FIX: Missing 404 page — Next.js shows a generic error without this.
// Added a branded page that matches the app design language.
import Link from "next/link";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page Not Found" };

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Ghost className="mb-6 h-16 w-16 text-primary opacity-60" aria-hidden="true" />
      <h1 className="text-5xl font-semibold tracking-tight">404</h1>
      <p className="mt-3 text-lg font-medium">Page not found</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for may have been moved, deleted, or never
        existed.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </main>
  );
}
