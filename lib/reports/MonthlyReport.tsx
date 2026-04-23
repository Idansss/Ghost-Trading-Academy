import React from "react";
import {
  Document,
  Page,
  Path,
  Svg,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 24, marginBottom: 8 },
  subtitle: { fontSize: 12, color: "#666", marginBottom: 16 },
  section: { marginTop: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 14, marginBottom: 6 },
  cardRow: { flexDirection: "row", flexWrap: "wrap" },
  card: { width: "48%", borderWidth: 1, borderColor: "#ddd", padding: 8, borderRadius: 4, marginRight: 8, marginBottom: 8 },
  table: { borderWidth: 1, borderColor: "#ddd" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tableHead: { backgroundColor: "#f5f5f5" },
  cell: { padding: 6, fontSize: 10 },
  small: { fontSize: 10, color: "#555" },
});

type MonthlyReportProps = {
  platformName: string;
  monthLabel: string;
  memberName: string;
  summary: {
    totalTrades: number;
    winRate: number;
    totalR: number;
    avgR: number;
    bestTrade: number;
    worstTrade: number;
    profitFactor: number;
  };
  psychology: {
    emotionBreakdown: Array<{ emotion: string; count: number }>;
    disciplineScore: number;
    planAdherenceRate: number;
  };
  bestTags: Array<{ tag: string; avgPnl: number }>;
  worstTags: Array<{ tag: string; avgPnl: number }>;
  nextMonthGoal: string;
  equityPath: string;
  trades: Array<{
    date: string;
    pair: string;
    direction: string;
    entry: number;
    exit: number;
    rResult: number;
    tags: string;
  }>;
};

export function MonthlyReport(props: MonthlyReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{props.platformName}</Text>
        <Text style={styles.subtitle}>
          Monthly Performance Report - {props.monthLabel}
        </Text>
        <Text>Member: {props.memberName}</Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.cardRow}>
          <View style={styles.card}><Text>Total trades: {props.summary.totalTrades}</Text></View>
          <View style={styles.card}><Text>Win rate: {props.summary.winRate.toFixed(1)}%</Text></View>
          <View style={styles.card}><Text>Total R: {props.summary.totalR.toFixed(2)}R</Text></View>
          <View style={styles.card}><Text>Avg R/trade: {props.summary.avgR.toFixed(2)}R</Text></View>
          <View style={styles.card}><Text>Best trade: {props.summary.bestTrade.toFixed(2)}%</Text></View>
          <View style={styles.card}><Text>Worst trade: {props.summary.worstTrade.toFixed(2)}%</Text></View>
          <View style={styles.card}><Text>Profit factor: {props.summary.profitFactor.toFixed(2)}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equity Curve</Text>
          <Svg width="520" height="160">
            <Path d={props.equityPath} stroke="#D4A017" strokeWidth={2} fill="none" />
          </Svg>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Psychology Summary</Text>
        <Text style={styles.small}>Discipline Score: {props.psychology.disciplineScore}/100</Text>
        <Text style={styles.small}>Plan Adherence: {props.psychology.planAdherenceRate.toFixed(1)}%</Text>
        <Text style={styles.small}>
          Emotions: {props.psychology.emotionBreakdown.map((e) => `${e.emotion} (${e.count})`).join(", ")}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Best Setups by Tag</Text>
          <Text style={styles.small}>
            {props.bestTags.map((item) => `${item.tag}: ${item.avgPnl.toFixed(2)}%`).join(" | ") || "N/A"}
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Worst Setups by Tag</Text>
          <Text style={styles.small}>
            {props.worstTags.map((item) => `${item.tag}: ${item.avgPnl.toFixed(2)}%`).join(" | ") || "N/A"}
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Month Goal</Text>
          <Text>{props.nextMonthGoal || "No goal set."}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Trade Log</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHead]}>
            {["Date", "Pair", "Dir", "Entry", "Exit", "R", "Tags"].map((head) => (
              <Text key={head} style={[styles.cell, { width: "14.2%" }]}>{head}</Text>
            ))}
          </View>
          {props.trades.slice(0, 30).map((trade, idx) => (
            <View key={`${trade.date}-${idx}`} style={styles.tableRow}>
              <Text style={[styles.cell, { width: "14.2%" }]}>{trade.date}</Text>
              <Text style={[styles.cell, { width: "14.2%" }]}>{trade.pair}</Text>
              <Text style={[styles.cell, { width: "14.2%" }]}>{trade.direction}</Text>
              <Text style={[styles.cell, { width: "14.2%" }]}>{trade.entry.toFixed(2)}</Text>
              <Text style={[styles.cell, { width: "14.2%" }]}>{trade.exit.toFixed(2)}</Text>
              <Text style={[styles.cell, { width: "14.2%" }]}>{trade.rResult.toFixed(2)}</Text>
              <Text style={[styles.cell, { width: "14.2%" }]}>{trade.tags}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
