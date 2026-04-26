// CLAUDE IMPROVEMENT: Phase 3 — build TradingView chart URLs for any signal or coin.
// Note: TradingView does not support pre-drawn price levels via URL parameters.
// Users open the chart and manually draw their entry/stop/TP levels, or paste
// the clipboard text from "Copy levels" to recreate them as drawing tools.

interface TradingViewUrlParams {
  symbol: string;
  exchange?: string;  // defaults to "BINANCE"
  interval?: string;  // signal timeframe string — normalised below
}

// Map from the app's internal interval labels to TradingView's interval codes.
// TradingView uses: "15" = 15m, "60" = 1H, "240" = 4H, "D" = 1D, "W" = 1W.
const INTERVAL_MAP: Record<string, string> = {
  "15m": "15",
  "15M": "15",
  "1h": "60",
  "1H": "60",
  "4h": "240",
  "4H": "240",
  "1d": "D",
  "1D": "D",
  "1w": "W",
  "1W": "W",
};

export function buildTradingViewUrl({
  symbol,
  exchange = "BINANCE",
  interval = "4H",
}: TradingViewUrlParams): string {
  const tvInterval = INTERVAL_MAP[interval] ?? INTERVAL_MAP[interval.toLowerCase()] ?? "240";
  const fullSymbol = `${exchange}:${symbol.toUpperCase()}`;
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(fullSymbol)}&interval=${tvInterval}`;
}
