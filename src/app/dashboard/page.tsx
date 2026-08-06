import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPortfolioSummary } from "@/lib/reports";

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });
const percentFmt = new Intl.NumberFormat("fi-FI", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { rows, totals, totalRentalYield } = await getPortfolioSummary(session.user.id);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-title">Portfolio dashboard</h1>
        <Link href="/apartments/new" className="btn btn-primary">
          + Add apartment
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No apartments yet. Add your first one to get started.</p>
      ) : (
        <>
          <dl className="card card-accent mb-6 grid max-w-md grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="detail-label">Total income</dt>
              <dd className="detail-value amount-positive">{eur.format(totals.totalIncome)}</dd>
            </div>
            <div>
              <dt className="detail-label">Total expenses</dt>
              <dd className="detail-value">{eur.format(totals.totalExpense)}</dd>
            </div>
            <div>
              <dt className="detail-label">Net profit</dt>
              <dd
                className={`detail-value ${totals.netProfit >= 0 ? "amount-positive" : "amount-negative"}`}
              >
                {eur.format(totals.netProfit)}
              </dd>
            </div>
            <div>
              <dt className="detail-label">Total rental yield</dt>
              <dd
                className={`detail-value-lg ${
                  totalRentalYield === null
                    ? ""
                    : totalRentalYield >= 0
                      ? "amount-positive"
                      : "amount-negative"
                }`}
              >
                {totalRentalYield !== null ? percentFmt.format(totalRentalYield) : "—"}
              </dd>
            </div>
          </dl>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ apartment, summary, rentalYield }) => (
              <li key={apartment.id}>
                <Link
                  href={`/apartments/${apartment.id}`}
                  className="card card-accent block text-sm transition-colors hover:border-accent/40"
                >
                  <p className="font-medium">{apartment.address}</p>
                  <p className="text-muted">{apartment.housingCompanyName}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <dt className="detail-label">Purchase price</dt>
                      <dd className="detail-value">{eur.format(Number(apartment.purchasePrice))}</dd>
                    </div>
                    <div>
                      <dt className="detail-label">Net profit</dt>
                      <dd
                        className={`detail-value ${summary.netProfit >= 0 ? "amount-positive" : "amount-negative"}`}
                      >
                        {eur.format(summary.netProfit)}
                      </dd>
                    </div>
                    <div>
                      <dt className="detail-label">Rental yield</dt>
                      <dd
                        className={`detail-value ${
                          rentalYield === null ? "" : rentalYield >= 0 ? "amount-positive" : "amount-negative"
                        }`}
                      >
                        {rentalYield !== null ? percentFmt.format(rentalYield) : "—"}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
