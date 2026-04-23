"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exchangeColumnMappings, genericCsvTemplateExample, genericCsvTemplateHeaders, type ExchangeType } from "@/lib/import/mappings";
import { fetchJson } from "@/lib/client-api";

type ParsedRow = Record<string, string>;

function parseCsv(content: string): ParsedRow[] {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((value) => value.trim());
  return lines.slice(1).map((line) => {
    const columns = line.split(",");
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = (columns[index] ?? "").trim();
      return acc;
    }, {});
  });
}

export default function TradeImportPage() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [exchange, setExchange] = useState<ExchangeType>("BINANCE");
  const [rows, setRows] = useState<ParsedRow[]>([]);

  const mapping = exchangeColumnMappings[exchange];
  const preview = useMemo(() => rows.slice(0, 10), [rows]);

  const mappedTrades = rows.map((row) => ({
    coin: row[mapping.pair],
    direction: row[mapping.side] === "SELL" ? "SHORT" : row[mapping.side] || "LONG",
    entryPrice: Number(row[mapping.entryPrice]),
    stopLoss: Number(row[mapping.stopLoss] || row[mapping.entryPrice]),
    takeProfit: Number(row[mapping.takeProfit] || row[mapping.entryPrice]),
    pnlPercent: Number(row[mapping.pnlPercent] || 0),
    outcome: (row[mapping.outcome] || "PENDING").toUpperCase(),
    setupType: row[mapping.setupType] || "Imported",
    tradeDate: row[mapping.tradeDate],
    tags: ["Imported"],
  }));

  const invalidIndexes = mappedTrades
    .map((trade, index) => ({ index, valid: Boolean(trade.coin && trade.tradeDate && Number.isFinite(trade.entryPrice)) }))
    .filter((row) => !row.valid)
    .map((row) => row.index);

  const importMutation = useMutation({
    mutationFn: () =>
      fetchJson<{ imported: number; duplicatesSkipped: number; skippedRowsCount: number }>(
        "/api/trades/import",
        { method: "POST", body: JSON.stringify(mappedTrades) },
      ),
    onSuccess: async (result: { imported: number; duplicatesSkipped: number; skippedRowsCount: number }) => {
      toast.success(`Imported ${result.imported} trades.`);
      await queryClient.invalidateQueries({ queryKey: ["trades"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Import Trades from CSV</h1>

      <Card>
        <CardHeader><CardTitle>Step 1: Exchange + Upload</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            {(["BINANCE", "BYBIT", "GENERIC"] as const).map((value) => (
              <Button key={value} variant={exchange === value ? "default" : "outline"} onClick={() => setExchange(value)}>
                {value}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>CSV File</Label>
            <Input
              type="file"
              accept=".csv"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const content = await file.text();
                setRows(parseCsv(content));
                setStep(2);
              }}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const content = [genericCsvTemplateHeaders.join(","), genericCsvTemplateExample.join(",")].join("\n");
              const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "ghost-generic-trades-template.csv";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download Generic CSV Template
          </Button>
        </CardContent>
      </Card>

      {step >= 2 ? (
        <Card>
          <CardHeader><CardTitle>Step 2: Preview + Validate</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Showing first {preview.length} rows. Rows with missing required fields are highlighted red.
            </p>
            <div className="overflow-auto rounded border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-2 text-left">Pair</th>
                    <th className="p-2 text-left">Direction</th>
                    <th className="p-2 text-left">Entry</th>
                    <th className="p-2 text-left">Trade Date</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((trade, index) => (
                    <tr key={`${trade.coin}-${index}`} className={invalidIndexes.includes(index) ? "bg-red-500/10" : ""}>
                      <td className="p-2">{trade.coin}</td>
                      <td className="p-2">{trade.direction}</td>
                      <td className="p-2">{trade.entryPrice}</td>
                      <td className="p-2">{trade.tradeDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={() => setStep(3)}>Continue to Confirm</Button>
          </CardContent>
        </Card>
      ) : null}

      {step >= 3 ? (
        <Card>
          <CardHeader><CardTitle>Step 3: Confirm Import</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p>Total rows parsed: {rows.length}</p>
            <p>Rows with missing fields: {invalidIndexes.length}</p>
            <p>Potential valid rows: {rows.length - invalidIndexes.length}</p>
            <Button disabled={importMutation.isPending} onClick={() => importMutation.mutate()}>
              {importMutation.isPending ? "Importing..." : "Confirm Import"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
