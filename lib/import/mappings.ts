export type ExchangeType = "BINANCE" | "BYBIT" | "GENERIC";

export type ColumnMapping = {
  pair: string;
  side: string;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  pnlPercent: string;
  outcome: string;
  setupType: string;
  tradeDate: string;
};

export const exchangeColumnMappings: Record<ExchangeType, ColumnMapping> = {
  BINANCE: {
    pair: "Symbol",
    side: "Side",
    entryPrice: "Price",
    stopLoss: "Stop Loss",
    takeProfit: "Take Profit",
    pnlPercent: "Realized PnL %",
    outcome: "Status",
    setupType: "Strategy",
    tradeDate: "Date(UTC)",
  },
  BYBIT: {
    pair: "Symbol",
    side: "Side",
    entryPrice: "Entry Price",
    stopLoss: "Stop Loss",
    takeProfit: "Take Profit",
    pnlPercent: "Closed P&L(%)",
    outcome: "Result",
    setupType: "Tag",
    tradeDate: "Created Time",
  },
  GENERIC: {
    pair: "pair",
    side: "direction",
    entryPrice: "entryPrice",
    stopLoss: "stopLoss",
    takeProfit: "takeProfit",
    pnlPercent: "pnlPercent",
    outcome: "outcome",
    setupType: "setupType",
    tradeDate: "tradeDate",
  },
};

export const genericCsvTemplateHeaders = [
  "pair",
  "direction",
  "entryPrice",
  "stopLoss",
  "takeProfit",
  "pnlPercent",
  "outcome",
  "setupType",
  "tradeDate",
];

export const genericCsvTemplateExample = [
  "BTC/USDT",
  "LONG",
  "64000",
  "62000",
  "68000",
  "4.5",
  "WIN",
  "Breakout",
  "2026-01-15T12:00:00.000Z",
];
