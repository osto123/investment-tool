import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { ApartmentYearReport } from "@/lib/reports";
import { categoryLabel } from "@/lib/validation";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#555555", marginBottom: 16 },
  table: { display: "flex", flexDirection: "column", borderTop: 1, borderColor: "#cccccc" },
  row: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#eeeeee",
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#333333",
    paddingVertical: 4,
    fontWeight: 700,
  },
  colDate: { width: "12%" },
  colCategory: { width: "28%" },
  colDesc: { width: "35%" },
  colReceipt: { width: "10%" },
  colAmount: { width: "15%", textAlign: "right" },
  totals: { marginTop: 16, alignItems: "flex-end" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    marginBottom: 2,
  },
});

const eur = (n: number) => `${n.toFixed(2)} €`;
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

function TaxReportDocument({ report }: { report: ApartmentYearReport }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          {report.apartment.address} — {report.year} tax report
        </Text>
        <Text style={styles.subtitle}>{report.apartment.housingCompanyName}</Text>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colCategory}>Category</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colReceipt}>Receipt</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          {report.transactions.map((tx) => (
            <View style={styles.row} key={tx.id}>
              <Text style={styles.colDate}>{fmtDate(tx.date)}</Text>
              <Text style={styles.colCategory}>{categoryLabel(tx.category)}</Text>
              <Text style={styles.colDesc}>{tx.description ?? ""}</Text>
              <Text style={styles.colReceipt}>{tx.hasReceipt ? "Yes" : "No"}</Text>
              <Text style={styles.colAmount}>
                {tx.type === "EXPENSE" ? "-" : ""}
                {eur(tx.amount)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Total income</Text>
            <Text>{eur(report.totals.totalIncome)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Total expenses</Text>
            <Text>{eur(report.totals.totalExpense)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Net profit</Text>
            <Text>{eur(report.totals.netProfit)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderTaxReportPdf(report: ApartmentYearReport): Promise<Buffer> {
  return renderToBuffer(<TaxReportDocument report={report} />);
}
