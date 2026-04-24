import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export type MarketTicker24hr = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  source: "binance" | "bybit";
};

async function fetchBinance24hr(symbol: string): Promise<MarketTicker24hr | null> {
  const response = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    lastPrice?: string;
    priceChangePercent?: string;
  };

  if (typeof payload.lastPrice !== "string") {
    return null;
  }

  return {
    symbol,
    lastPrice: payload.lastPrice,
    priceChangePercent: String(payload.priceChangePercent ?? "0"),
    source: "binance",
  };
}

async function fetchBybitSpot24hr(symbol: string): Promise<MarketTicker24hr | null> {
  const response = await fetch(
    `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${encodeURIComponent(symbol)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as {
    retCode?: number;
    result?: { list?: Array<{ lastPrice?: string; price24hPcnt?: string }> };
  };

  const row = body.result?.list?.[0];
  if (!row?.lastPrice) {
    return null;
  }

  const fraction = Number(row.price24hPcnt ?? 0);
  const percent = Number.isFinite(fraction) ? fraction * 100 : 0;

  return {
    symbol,
    lastPrice: String(row.lastPrice),
    priceChangePercent: percent.toFixed(4),
    source: "bybit",
  };
}

/**
 * Returns 24h ticker stats for one or more spot symbols (e.g. BTCUSDT).
 * Proxies public exchange APIs from the server so browser/geo/CORS issues
 * on api.binance.com do not break the watchlist UI.
 */
export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("symbols") ?? "";
  const symbols = Array.from(
    new Set(
      raw
        .split(",")
        .map((segment) => segment.trim().toUpperCase())
        .filter(Boolean),
    ),
  );

  if (!symbols.length) {
    return NextResponse.json({ error: "Missing symbols query parameter." }, { status: 400 });
  }

  const tickers = await Promise.all(
    symbols.map(async (symbol) => {
      const fromBinance = await fetchBinance24hr(symbol);
      if (fromBinance) {
        return fromBinance;
      }
      return fetchBybitSpot24hr(symbol);
    }),
  );

  return NextResponse.json({
    tickers: tickers.filter((row): row is MarketTicker24hr => row !== null),
  });
}
