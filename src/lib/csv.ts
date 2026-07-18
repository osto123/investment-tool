import { stringify } from "csv-stringify/sync";
import type { ApartmentYearReport } from "@/lib/reports";
import { categoryLabel } from "@/lib/validation";

export function renderTaxReportCsv(report: ApartmentYearReport): string {
  const rows = report.transactions.map((tx) => [
    tx.date.toISOString().slice(0, 10),
    tx.type,
    categoryLabel(tx.category),
    tx.description ?? "",
    tx.amount.toFixed(2),
    tx.hasReceipt ? "yes" : "no",
  ]);

  return stringify([
    ["Date", "Type", "Category", "Description", "Amount (EUR)", "Has receipt"],
    ...rows,
    [],
    ["Total income", "", "", "", report.totals.totalIncome.toFixed(2), ""],
    ["Total expenses", "", "", "", report.totals.totalExpense.toFixed(2), ""],
    ["Net profit", "", "", "", report.totals.netProfit.toFixed(2), ""],
  ]);
}
