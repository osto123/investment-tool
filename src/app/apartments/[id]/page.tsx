import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnedApartment } from "@/lib/ownership";
import { deleteApartment } from "@/lib/actions/apartments";
import { getCurrentTenancy, getApartmentSummary, calculateRentalYield } from "@/lib/reports";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ResponsiveTable, type ResponsiveTableColumn, type ResponsiveTableRow } from "@/components/responsive-table";
import { categoryLabel } from "@/lib/validation";

const transactionColumns: ResponsiveTableColumn[] = [
  { key: "date", header: "Date", primary: true },
  { key: "category", header: "Category" },
  { key: "description", header: "Description" },
  { key: "receipt", header: "Receipt" },
  { key: "amount", header: "Amount", align: "right" },
  { key: "edit", header: "", align: "right", hideLabel: true },
];

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("fi-FI");
const percentFmt = new Intl.NumberFormat("fi-FI", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export default async function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const apartment = await getOwnedApartment(id, session.user.id);
  if (!apartment) notFound();

  const currentTenancy = await getCurrentTenancy(apartment.id);
  const summary = await getApartmentSummary(apartment.id);
  const transactions = await prisma.transaction.findMany({
    where: { apartmentId: apartment.id },
    orderBy: { date: "desc" },
  });
  const boundDelete = deleteApartment.bind(null, apartment.id);

  const transactionRows: ResponsiveTableRow[] = transactions.map((tx) => ({
    id: tx.id,
    cells: {
      date: dateFmt.format(tx.date),
      category: categoryLabel(tx.category),
      description: tx.description ?? "—",
      receipt: tx.receiptStoragePath ? (
        <a
          href={`/api/receipts/${tx.id}`}
          target="_blank"
          rel="noreferrer"
          className="link-muted hover:underline"
        >
          View
        </a>
      ) : (
        "—"
      ),
      amount: (
        <span className={tx.type === "INCOME" ? "amount-positive" : ""}>
          {tx.type === "EXPENSE" ? "−" : "+"}
          {eur.format(Number(tx.amount))}
        </span>
      ),
      edit: (
        <Link
          href={`/apartments/${apartment.id}/transactions/${tx.id}/edit`}
          className="link-muted hover:underline"
        >
          Edit
        </Link>
      ),
    },
  }));

  const rentalYield = currentTenancy
    ? calculateRentalYield(
        Number(apartment.purchasePrice),
        Number(currentTenancy.monthlyRent),
        apartment.maintenanceFeeHoito ? Number(apartment.maintenanceFeeHoito) : 0
      )
    : null;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard" className="link-muted">
            ← Back to dashboard
          </Link>
          <h1 className="page-title mt-2">{apartment.address}</h1>
          <p className="text-sm text-muted">{apartment.housingCompanyName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/apartments/${apartment.id}/edit`} className="btn btn-outline">
            Edit
          </Link>
          <ConfirmDeleteButton
            action={boundDelete}
            label="Delete apartment"
            confirmText="Delete this apartment and all its tenancies/transactions?"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div>
          <dl className="card card-accent grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="detail-label">Size</dt>
              <dd className="detail-value">{apartment.sizeSqm.toString()} m²</dd>
            </div>
            <div>
              <dt className="detail-label">Purchase price</dt>
              <dd className="detail-value">{eur.format(Number(apartment.purchasePrice))}</dd>
            </div>
            <div>
              <dt className="detail-label">Purchase date</dt>
              <dd className="detail-value">{dateFmt.format(apartment.purchaseDate)}</dd>
            </div>
            <div>
              <dt className="detail-label">Hoitovastike</dt>
              <dd className="detail-value">
                {apartment.maintenanceFeeHoito
                  ? `${eur.format(Number(apartment.maintenanceFeeHoito))} / mo`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="detail-label">Pääomavastike</dt>
              <dd className="detail-value">
                {apartment.maintenanceFeePaaoma
                  ? `${eur.format(Number(apartment.maintenanceFeePaaoma))} / mo`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="detail-label">Rental yield</dt>
              <dd
                className={`detail-value-lg ${
                  rentalYield === null ? "" : rentalYield >= 0 ? "amount-positive" : "amount-negative"
                }`}
              >
                {rentalYield !== null ? percentFmt.format(rentalYield) : "—"}
              </dd>
            </div>
            {apartment.notes && (
              <div className="col-span-2">
                <dt className="detail-label">Notes</dt>
                <dd className="detail-value whitespace-pre-wrap">{apartment.notes}</dd>
              </div>
            )}
          </dl>

          <div className="card card-accent mt-6 text-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="card-title">Current tenant</h2>
              <Link href={`/apartments/${apartment.id}/tenancies`} className="link-muted hover:underline">
                Manage tenancies →
              </Link>
            </div>
            {currentTenancy ? (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="detail-label">Tenant</dt>
                  <dd className="detail-value">{currentTenancy.tenantName}</dd>
                </div>
                <div>
                  <dt className="detail-label">Monthly rent</dt>
                  <dd className="detail-value">{eur.format(Number(currentTenancy.monthlyRent))}</dd>
                </div>
                <div>
                  <dt className="detail-label">Lease start</dt>
                  <dd className="detail-value">{dateFmt.format(currentTenancy.leaseStart)}</dd>
                </div>
                <div>
                  <dt className="detail-label">Contact</dt>
                  <dd className="detail-value">{currentTenancy.tenantContact ?? "—"}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted">No current tenant.</p>
            )}
          </div>

          <div className="card card-accent mt-6 text-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="card-title">Financial summary (all time)</h2>
              <Link href={`/apartments/${apartment.id}/reports`} className="link-muted hover:underline">
                Tax report →
              </Link>
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3">
              <div>
                <dt className="detail-label">Income</dt>
                <dd className="detail-value amount-positive">{eur.format(summary.totalIncome)}</dd>
              </div>
              <div>
                <dt className="detail-label">Expenses</dt>
                <dd className="detail-value">{eur.format(summary.totalExpense)}</dd>
              </div>
              <div>
                <dt className="detail-label">Net profit</dt>
                <dd
                  className={`detail-value ${summary.netProfit >= 0 ? "amount-positive" : "amount-negative"}`}
                >
                  {eur.format(summary.netProfit)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="card card-accent text-sm">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="card-title">Transactions</h2>
            <div className="flex items-center gap-3">
              <Link href={`/apartments/${apartment.id}/transactions`} className="link-muted hover:underline">
                View all →
              </Link>
              <Link href={`/apartments/${apartment.id}/transactions/new`} className="btn btn-primary">
                + Add transaction
              </Link>
            </div>
          </div>
          <ResponsiveTable
            columns={transactionColumns}
            rows={transactionRows}
            emptyMessage="No transactions recorded yet."
          />
        </div>
      </div>
    </div>
  );
}
