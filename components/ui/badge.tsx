import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/10 text-primary",
        success:
          "border-[color:var(--color-green)]/20 bg-[color:var(--color-green-light)] text-[color:var(--color-green)]",
        danger:
          "border-[color:var(--color-red)]/20 bg-[color:var(--color-red-light)] text-[color:var(--color-red)]",
        info: "border-[color:var(--color-blue)]/20 bg-[color:var(--color-blue-light)] text-[color:var(--color-blue)]",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        muted: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
