import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getApartmentYearReport } from "@/lib/reports";
import { categoryLabel } from "@/lib/validation";

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("fi-FI");

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const { year: yearParam } = await searchParams;

  const apartment = await prisma.apartment.findUnique({ where: { id } });
  if (!apartment) notFound();

  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const report = await getApartmentYearReport(id, year);

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <Link href={`/apartments/${id}`} className="link-muted">
          ← Back to apartment
        </Link>
        <h1 className="page-title mt-2">Tax report</h1>
        <p className="text-sm text-muted">{apartment.address}</p>
      </div>

      <form className="mb-6 flex items-end gap-3" action={`/apartments/${id}/reports`}>
        <div>
          <label htmlFor="year" className="field-label">
            Tax year
          </label>
          <input id="year" name="year" type="number" defaultValue={year} className="field-input w-28" />
        </div>
        <button type="submit" className="btn btn-outline">
          View
        </button>
        <a href={`/api/apartments/${id}/reports/${year}/pdf`} className="btn btn-primary">
          Download PDF
        </a>
        <a href={`/api/apartments/${id}/reports/${year}/csv`} className="btn btn-outline">
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
        <dl className="mt-4 grid grid-cols-3 gap-x-6 border-t border-border pt-3">
          <div>
            <dt className="text-muted">Income</dt>
            <dd className="amount-positive">{eur.format(report.totals.totalIncome)}</dd>
          </div>
          <div>
            <dt className="text-muted">Expenses</dt>
            <dd>{eur.format(report.totals.totalExpense)}</dd>
          </div>
          <div>
            <dt className="text-muted">Net profit</dt>
            <dd className={report.totals.netProfit >= 0 ? "amount-positive" : "text-red-700 dark:text-red-400"}>
              {eur.format(report.totals.netProfit)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Receipt</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {report.transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2">{dateFmt.format(tx.date)}</td>
                <td className="px-4 py-2">{categoryLabel(tx.category)}</td>
                <td className="px-4 py-2">{tx.description ?? "—"}</td>
                <td className="px-4 py-2">{tx.hasReceipt ? "Yes" : "—"}</td>
                <td className={`px-4 py-2 text-right ${tx.type === "INCOME" ? "amount-positive" : ""}`}>
                  {tx.type === "EXPENSE" ? "−" : "+"}
                  {eur.format(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
