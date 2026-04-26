"use client";

// CLAUDE IMPROVEMENT: Phase 3 — "Open in TradingView" and "Copy levels" actions.
// This is a client component so it can use the clipboard API and open links.
// It receives raw signal string fields so the server-component signal detail page
// can pass props without serialisation issues.

import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { buildTradingViewUrl } from "@/lib/charts/tradingViewUrl";
import { normalizeChartSymbol } from "@/lib/chart-utils";

interface SignalActionsProps {
  coin: string;
  timeframe?: string | null;
  entryZone: string;
  stopLoss: string;
  tp1?: string | null;
  tp2?: string | null;
  tp3?: string | null;
  className?: string;
}

export function SignalActions({
  coin,
  timeframe,
  entryZone,
  stopLoss,
  tp1,
  tp2,
  tp3,
  className,
}: SignalActionsProps) {
  const tvUrl = buildTradingViewUrl({
    symbol: normalizeChartSymbol(coin),
    interval: timeframe ?? "4H",
  });

  async function copyLevels() {
    const lines = [
      `${coin.toUpperCase()} ${timeframe ?? "4H"} Setup`,
      `Entry: ${entryZone}`,
      `Stop: ${stopLoss}`,
      tp1 && tp1 !== "N/A" ? `TP1: ${tp1}` : null,
      tp2 && tp2 !== "N/A" ? `TP2: ${tp2}` : null,
      tp3 && tp3 !== "N/A" ? `TP3: ${tp3}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(lines);
      toast.success("Levels copied to clipboard.");
    } catch {
      toast.error("Copy failed — try selecting and copying manually.");
    }
  }

  return (
    <div className={`flex items-center gap-3 flex-wrap ${className ?? ""}`}>
      {/* Use a real <a> tag — window.open can be blocked by browsers */}
      <a
        href={tvUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors min-h-[44px] min-w-[44px] py-2"
        aria-label={`Open ${coin} chart in TradingView`}
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        Open in TradingView
      </a>

      <button
        type="button"
        onClick={copyLevels}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors min-h-[44px] min-w-[44px] py-2"
        aria-label="Copy signal levels to clipboard"
      >
        <Copy className="h-3.5 w-3.5 shrink-0" />
        Copy levels
      </button>
    </div>
  );
}
