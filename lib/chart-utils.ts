export const CHART_INTERVAL_OPTIONS = [
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
] as const;

export type ChartInterval = (typeof CHART_INTERVAL_OPTIONS)[number]["value"];

const SUPPORTED_QUOTES = ["USDT", "USDC", "BUSD", "FDUSD", "BTC", "ETH"] as const;

export function normalizeChartSymbol(raw: string) {
  let normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (normalized.endsWith("PERP")) {
    normalized = normalized.slice(0, -4);
  }

  if (normalized.endsWith("USD") && !normalized.endsWith("USDT")) {
    normalized = `${normalized.slice(0, -3)}USDT`;
  }

  if (SUPPORTED_QUOTES.some((quote) => normalized.endsWith(quote))) {
    return normalized;
  }

  return `${normalized}USDT`;
}

export function inferChartInterval(raw?: string | null): ChartInterval {
  const normalized = raw?.trim().toLowerCase();

  if (normalized === "15m" || normalized === "1h" || normalized === "4h" || normalized === "1d") {
    return normalized;
  }

  if (normalized === "15min" || normalized === "15mins") {
    return "15m";
  }

  if (normalized === "1h" || normalized === "1hr") {
    return "1h";
  }

  if (normalized === "4h" || normalized === "4hr") {
    return "4h";
  }

  if (normalized === "1d" || normalized === "1day" || normalized === "daily") {
    return "1d";
  }

  return "4h";
}

export function parseChartPrice(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const matches = value.match(/-?\d[\d,]*\.?\d*/g);
  if (!matches?.length) {
    return null;
  }

  const parsed = Number(matches[0].replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseEntryZonePrice(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const matches = value.match(/-?\d[\d,]*\.?\d*/g);
  if (!matches?.length) {
    return null;
  }

  const parsedValues = matches
    .slice(0, 2)
    .map((match) => Number(match.replace(/,/g, "")))
    .filter((entry) => Number.isFinite(entry));

  if (!parsedValues.length) {
    return null;
  }

  if (parsedValues.length === 1) {
    return parsedValues[0];
  }

  return (parsedValues[0] + parsedValues[1]) / 2;
}
