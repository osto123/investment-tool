import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { deleteApartment } from "@/lib/actions/apartments";
import { getCurrentTenancy, getApartmentSummary } from "@/lib/reports";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("fi-FI");

export default async function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const apartment = await prisma.apartment.findUnique({ where: { id } });
  if (!apartment) notFound();

  const currentTenancy = await getCurrentTenancy(apartment.id);
  const summary = await getApartmentSummary(apartment.id);
  const boundDelete = deleteApartment.bind(null, apartment.id);

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/dashboard" className="link-muted">
            ← Back to dashboard
          </Link>
          <h1 className="page-title mt-2">{apartment.address}</h1>
          <p className="text-sm text-muted">{apartment.housingCompanyName}</p>
        </div>
        <div className="flex items-center gap-2">
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

      <dl className="card grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 text-sm">
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
        {apartment.notes && (
          <div className="col-span-2">
            <dt className="detail-label">Notes</dt>
            <dd className="detail-value whitespace-pre-wrap">{apartment.notes}</dd>
          </div>
        )}
      </dl>

      <div className="card mt-6 max-w-xl text-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="card-title">Current tenant</h2>
          <Link href={`/apartments/${apartment.id}/tenancies`} className="link-muted hover:underline">
            Manage tenancies →
          </Link>
        </div>
        {currentTenancy ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
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

      <div className="card mt-6 max-w-xl text-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="card-title">Financial summary (all time)</h2>
          <div className="flex items-center gap-4">
            <Link href={`/apartments/${apartment.id}/transactions`} className="link-muted hover:underline">
              View transactions →
            </Link>
            <Link href={`/apartments/${apartment.id}/reports`} className="link-muted hover:underline">
              Tax report →
            </Link>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-x-6 gap-y-2">
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
              className={`detail-value ${summary.netProfit >= 0 ? "amount-positive" : "text-red-700 dark:text-red-400"}`}
            >
              {eur.format(summary.netProfit)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
