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
        <Link href={`/apartments/${id}`} className="text-sm text-black/60 dark:text-white/60">
          ← Back to apartment
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Tax report</h1>
        <p className="text-sm text-black/60 dark:text-white/60">{apartment.address}</p>
      </div>

      <form className="mb-6 flex items-end gap-3" action={`/apartments/${id}/reports`}>
        <div>
          <label htmlFor="year" className="block text-sm font-medium">
            Tax year
          </label>
          <input
            id="year"
            name="year"
            type="number"
            defaultValue={year}
            className="w-28 rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          />
        </div>
        <button
          type="submit"
          className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20"
        >
          View
        </button>
        <a
          href={`/api/apartments/${id}/reports/${year}/pdf`}
          className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Download PDF
        </a>
        <a
          href={`/api/apartments/${id}/reports/${year}/csv`}
          className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20"
        >
          Download CSV
        </a>
      </form>

      <div className="mb-6 max-w-xl rounded-lg border border-black/10 p-5 text-sm dark:border-white/15">
        <h2 className="mb-3 font-medium">Category breakdown</h2>
        {report.byCategory.length === 0 ? (
          <p className="text-black/60 dark:text-white/60">No transactions for {year}.</p>
        ) : (
          <table className="w-full text-left">
            <tbody>
              {report.byCategory.map((c) => (
                <tr
                  key={c.category}
                  className="border-b border-black/5 last:border-0 dark:border-white/10"
                >
                  <td className="py-1">{c.label}</td>
                  <td
                    className={`py-1 text-right ${
                      c.type === "INCOME" ? "text-green-700 dark:text-green-400" : ""
                    }`}
                  >
                    {c.type === "EXPENSE" ? "−" : "+"}
                    {eur.format(c.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <dl className="mt-4 grid grid-cols-3 gap-x-6 border-t border-black/10 pt-3 dark:border-white/15">
          <div>
            <dt className="text-black/60 dark:text-white/60">Income</dt>
            <dd className="text-green-700 dark:text-green-400">
              {eur.format(report.totals.totalIncome)}
            </dd>
          </div>
          <div>
            <dt className="text-black/60 dark:text-white/60">Expenses</dt>
            <dd>{eur.format(report.totals.totalExpense)}</dd>
          </div>
          <div>
            <dt className="text-black/60 dark:text-white/60">Net profit</dt>
            <dd
              className={
                report.totals.netProfit >= 0
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400"
              }
            >
              {eur.format(report.totals.netProfit)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-black/60 dark:border-white/15 dark:text-white/60">
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
              <tr key={tx.id} className="border-b border-black/5 last:border-0 dark:border-white/10">
                <td className="px-4 py-2">{dateFmt.format(tx.date)}</td>
                <td className="px-4 py-2">{categoryLabel(tx.category)}</td>
                <td className="px-4 py-2">{tx.description ?? "—"}</td>
                <td className="px-4 py-2">{tx.hasReceipt ? "Yes" : "—"}</td>
                <td
                  className={`px-4 py-2 text-right ${
                    tx.type === "INCOME" ? "text-green-700 dark:text-green-400" : ""
                  }`}
                >
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
