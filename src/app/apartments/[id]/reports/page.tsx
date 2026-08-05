import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedApartment } from "@/lib/ownership";
import { getApartmentYearReport } from "@/lib/reports";
import { categoryLabel } from "@/lib/validation";
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/responsive-table";

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("fi-FI");

const reportTransactionColumns: ResponsiveTableColumn[] = [
  { key: "date", header: "Date", primary: true },
  { key: "category", header: "Category" },
  { key: "description", header: "Description" },
  { key: "receipt", header: "Receipt" },
  { key: "amount", header: "Amount", align: "right" },
];

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const { year: yearParam } = await searchParams;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const apartment = await getOwnedApartment(id, session.user.id);
  if (!apartment) notFound();

  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const report = await getApartmentYearReport(id, year, session.user.id);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Link href={`/apartments/${id}`} className="link-muted">
          ← Back to apartment
        </Link>
        <h1 className="page-title mt-2">Tax report</h1>
        <p className="text-sm text-muted">{apartment.address}</p>
      </div>

      <form
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        action={`/apartments/${id}/reports`}
      >
        <div>
          <label htmlFor="year" className="field-label">
            Tax year
          </label>
          <input id="year" name="year" type="number" defaultValue={year} className="field-input w-28" />
        </div>
        <button type="submit" className="btn btn-outline w-full sm:w-auto">
          View
        </button>
        <a href={`/api/apartments/${id}/reports/${year}/pdf`} className="btn btn-primary w-full sm:w-auto">
          Download PDF
        </a>
        <a href={`/api/apartments/${id}/reports/${year}/csv`} className="btn btn-outline w-full sm:w-auto">
          Download CSV
        </a>
      </form>

      <div className="card mb-6 max-w-xl text-sm">
        <h2 className="card-title mb-3">Category breakdown</h2>
        {report.byCategory.length === 0 ? (
          <p className="text-muted">No transactions for {year}.</p>
        ) : (
          <table className="w-full text-left">
            <tbody>
              {report.byCategory.map((c) => (
                <tr key={c.category} className="border-b border-border/60 last:border-0">
                  <td className="py-1">{c.label}</td>
                  <td className={`py-1 text-right ${c.type === "INCOME" ? "amount-positive" : ""}`}>
                    {c.type === "EXPENSE" ? "−" : "+"}
                    {eur.format(c.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-border pt-3 sm:grid-cols-3">
          <div>
            <dt className="detail-label">Income</dt>
            <dd className="detail-value amount-positive">{eur.format(report.totals.totalIncome)}</dd>
          </div>
          <div>
            <dt className="detail-label">Expenses</dt>
            <dd className="detail-value">{eur.format(report.totals.totalExpense)}</dd>
          </div>
          <div>
            <dt className="detail-label">Net profit</dt>
            <dd
              className={`detail-value ${report.totals.netProfit >= 0 ? "amount-positive" : "text-red-700 dark:text-red-400"}`}
            >
              {eur.format(report.totals.netProfit)}
            </dd>
          </div>
        </dl>
      </div>

      <ResponsiveTable
        columns={reportTransactionColumns}
        rows={report.transactions.map((tx) => ({
          id: tx.id,
          cells: {
            date: dateFmt.format(tx.date),
            category: categoryLabel(tx.category),
            description: tx.description ?? "—",
            receipt: tx.hasReceipt ? "Yes" : "—",
            amount: (
              <span className={tx.type === "INCOME" ? "amount-positive" : ""}>
                {tx.type === "EXPENSE" ? "−" : "+"}
                {eur.format(tx.amount)}
              </span>
            ),
          },
        }))}
        emptyMessage="No transactions for this year."
      />
    </div>
  );
}
