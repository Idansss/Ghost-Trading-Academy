"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({ href, label = "Back" }: { href?: string; label?: string }) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 mb-2 gap-2 text-muted-foreground"
      onClick={handleClick}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
