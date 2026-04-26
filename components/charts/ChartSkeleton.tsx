// CLAUDE IMPROVEMENT: Reusable loading skeleton that matches chart dimensions
// so the layout doesn't shift when the real chart mounts.
export function ChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div
      className="w-full rounded-3xl border bg-muted/40 animate-pulse"
      style={{ height }}
      aria-label="Loading chart"
      role="status"
    />
  );
}
