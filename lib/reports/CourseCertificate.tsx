import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    justifyContent: "center",
    alignItems: "center",
    fontSize: 14,
  },
  title: { fontSize: 34, marginBottom: 24 },
  subtitle: { fontSize: 16, marginBottom: 8 },
  name: { fontSize: 28, marginVertical: 16 },
  course: { fontSize: 22, marginVertical: 12 },
  date: { fontSize: 12, marginTop: 18, color: "#666" },
  border: {
    borderWidth: 3,
    borderColor: "#D4A017",
    padding: 28,
    width: "100%",
    textAlign: "center",
  },
});

export function CourseCertificate({
  platformName,
  memberName,
  courseName,
  completionDate,
}: {
  platformName: string;
  memberName: string;
  courseName: string;
  completionDate: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.title}>Certificate of Completion</Text>
          <Text style={styles.subtitle}>This certifies that</Text>
          <Text style={styles.name}>{memberName}</Text>
          <Text style={styles.subtitle}>has successfully completed</Text>
          <Text style={styles.course}>{courseName}</Text>
          <Text style={styles.subtitle}>at {platformName}</Text>
          <Text style={styles.date}>Completed on {completionDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
