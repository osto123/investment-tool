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
          <Link href="/dashboard" className="text-sm text-black/60 dark:text-white/60">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-xl font-semibold">{apartment.address}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {apartment.housingCompanyName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/apartments/${apartment.id}/edit`}
            className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20"
          >
            Edit
          </Link>
          <ConfirmDeleteButton
            action={boundDelete}
            label="Delete apartment"
            confirmText="Delete this apartment and all its tenancies/transactions?"
          />
        </div>
      </div>

      <dl className="grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-black/10 p-5 text-sm dark:border-white/15">
        <div>
          <dt className="text-black/60 dark:text-white/60">Size</dt>
          <dd>{apartment.sizeSqm.toString()} m²</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">Purchase price</dt>
          <dd>{eur.format(Number(apartment.purchasePrice))}</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">Purchase date</dt>
          <dd>{dateFmt.format(apartment.purchaseDate)}</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">Hoitovastike</dt>
          <dd>
            {apartment.maintenanceFeeHoito
              ? `${eur.format(Number(apartment.maintenanceFeeHoito))} / mo`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">Pääomavastike</dt>
          <dd>
            {apartment.maintenanceFeePaaoma
              ? `${eur.format(Number(apartment.maintenanceFeePaaoma))} / mo`
              : "—"}
          </dd>
        </div>
        {apartment.notes && (
          <div className="col-span-2">
            <dt className="text-black/60 dark:text-white/60">Notes</dt>
            <dd className="whitespace-pre-wrap">{apartment.notes}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 max-w-xl rounded-lg border border-black/10 p-5 text-sm dark:border-white/15">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Current tenant</h2>
          <Link
            href={`/apartments/${apartment.id}/tenancies`}
            className="text-sm text-black/60 hover:underline dark:text-white/60"
          >
            Manage tenancies →
          </Link>
        </div>
        {currentTenancy ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <dt className="text-black/60 dark:text-white/60">Tenant</dt>
              <dd>{currentTenancy.tenantName}</dd>
            </div>
            <div>
              <dt className="text-black/60 dark:text-white/60">Monthly rent</dt>
              <dd>{eur.format(Number(currentTenancy.monthlyRent))}</dd>
            </div>
            <div>
              <dt className="text-black/60 dark:text-white/60">Lease start</dt>
              <dd>{dateFmt.format(currentTenancy.leaseStart)}</dd>
            </div>
            <div>
              <dt className="text-black/60 dark:text-white/60">Contact</dt>
              <dd>{currentTenancy.tenantContact ?? "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-black/60 dark:text-white/60">No current tenant.</p>
        )}
      </div>

      <div className="mt-6 max-w-xl rounded-lg border border-black/10 p-5 text-sm dark:border-white/15">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Financial summary (all time)</h2>
          <div className="flex items-center gap-4">
            <Link
              href={`/apartments/${apartment.id}/transactions`}
              className="text-sm text-black/60 hover:underline dark:text-white/60"
            >
              View transactions →
            </Link>
            <Link
              href={`/apartments/${apartment.id}/reports`}
              className="text-sm text-black/60 hover:underline dark:text-white/60"
            >
              Tax report →
            </Link>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-x-6 gap-y-2">
          <div>
            <dt className="text-black/60 dark:text-white/60">Income</dt>
            <dd className="text-green-700 dark:text-green-400">{eur.format(summary.totalIncome)}</dd>
          </div>
          <div>
            <dt className="text-black/60 dark:text-white/60">Expenses</dt>
            <dd>{eur.format(summary.totalExpense)}</dd>
          </div>
          <div>
            <dt className="text-black/60 dark:text-white/60">Net profit</dt>
            <dd
              className={
                summary.netProfit >= 0
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400"
              }
            >
              {eur.format(summary.netProfit)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
