import Link from "next/link";
import { getPortfolioSummary } from "@/lib/reports";

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });

export default async function DashboardPage() {
  const { rows, totals } = await getPortfolioSummary();

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Portfolio dashboard</h1>
        <Link
          href="/apartments/new"
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          + Add apartment
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          No apartments yet. Add your first one to get started.
        </p>
      ) : (
        <>
          <dl className="mb-6 grid max-w-md grid-cols-3 gap-x-6 gap-y-2 rounded-lg border border-black/10 p-4 text-sm dark:border-white/15">
            <div>
              <dt className="text-black/60 dark:text-white/60">Total income</dt>
              <dd className="text-green-700 dark:text-green-400">{eur.format(totals.totalIncome)}</dd>
            </div>
            <div>
              <dt className="text-black/60 dark:text-white/60">Total expenses</dt>
              <dd>{eur.format(totals.totalExpense)}</dd>
            </div>
            <div>
              <dt className="text-black/60 dark:text-white/60">Net profit</dt>
              <dd
                className={
                  totals.netProfit >= 0
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                }
              >
                {eur.format(totals.netProfit)}
              </dd>
            </div>
          </dl>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ apartment, summary }) => (
              <li key={apartment.id}>
                <Link
                  href={`/apartments/${apartment.id}`}
                  className="block rounded-lg border border-black/10 p-4 text-sm hover:border-black/25 dark:border-white/15 dark:hover:border-white/30"
                >
                  <p className="font-medium">{apartment.address}</p>
                  <p className="text-black/60 dark:text-white/60">
                    {apartment.housingCompanyName}
                  </p>
                  <p className="mt-2 text-black/60 dark:text-white/60">
                    Purchase price: {eur.format(Number(apartment.purchasePrice))}
                  </p>
                  <p
                    className={
                      summary.netProfit >= 0
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }
                  >
                    Net profit: {eur.format(summary.netProfit)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
