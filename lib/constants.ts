export const TRADING_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "XRP/USDT",
  "BNB/USDT",
];

export const SUPPORTED_TICKER_SYMBOLS = [
  { symbol: "BTCUSDT", label: "BTC/USDT", coingeckoId: "bitcoin" },
  { symbol: "ETHUSDT", label: "ETH/USDT", coingeckoId: "ethereum" },
  { symbol: "SOLUSDT", label: "SOL/USDT", coingeckoId: "solana" },
  { symbol: "BNBUSDT", label: "BNB/USDT", coingeckoId: "binancecoin" },
  { symbol: "XRPUSDT", label: "XRP/USDT", coingeckoId: "ripple" },
  { symbol: "ADAUSDT", label: "ADA/USDT", coingeckoId: "cardano" },
  { symbol: "DOGEUSDT", label: "DOGE/USDT", coingeckoId: "dogecoin" },
  { symbol: "AVAXUSDT", label: "AVAX/USDT", coingeckoId: "avalanche-2" },
  { symbol: "TONUSDT", label: "TON/USDT", coingeckoId: "the-open-network" },
  { symbol: "LINKUSDT", label: "LINK/USDT", coingeckoId: "chainlink" },
] as const;

export const DEFAULT_TICKER_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
] as const;

export const TICKER_SYMBOL_SET = new Set<string>(
  SUPPORTED_TICKER_SYMBOLS.map((item) => item.symbol),
);

export const MONTH_NAMES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
