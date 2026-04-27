"use client";

// CLAUDE FIX: coin_logo_component — show actual coin logos beside coin names everywhere
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CoinLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

const FAILED_LOGOS = new Set<string>();

function extractBaseSymbol(symbol: string): string {
  return symbol
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/USDT$|USDC$|USD$|BUSD$|FDUSD$|DAI$|BTC$|ETH$/i, "")
    .toLowerCase();
}

export function CoinLogo({ symbol, size = 24, className }: CoinLogoProps) {
  const baseSymbol = extractBaseSymbol(symbol);
  const [error, setError] = useState(FAILED_LOGOS.has(baseSymbol));

  function handleError() {
    FAILED_LOGOS.add(baseSymbol);
    setError(true);
  }

  if (error || !baseSymbol) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground",
          className,
        )}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {symbol.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://assets.coincap.io/assets/icons/${baseSymbol}@2x.png`}
      alt={`${symbol} logo`}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full", className)}
      onError={handleError}
      loading="lazy"
      aria-hidden="true"
    />
  );
}
