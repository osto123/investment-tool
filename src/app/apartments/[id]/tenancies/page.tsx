import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnedApartment } from "@/lib/ownership";
import { ResponsiveTable, type ResponsiveTableColumn, type ResponsiveTableRow } from "@/components/responsive-table";

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("fi-FI");

const tenancyColumns: ResponsiveTableColumn[] = [
  { key: "tenant", header: "Tenant", primary: true },
  { key: "rent", header: "Rent" },
  { key: "leaseStart", header: "Lease start" },
  { key: "leaseEnd", header: "Lease end" },
  { key: "edit", header: "", align: "right", hideLabel: true },
];

export default async function TenanciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const apartment = await getOwnedApartment(id, session.user.id);
  if (!apartment) notFound();

  const tenancies = await prisma.tenancy.findMany({
    where: { apartmentId: id },
    orderBy: { leaseStart: "desc" },
  });

  const tenancyRows: ResponsiveTableRow[] = tenancies.map((tenancy) => ({
    id: tenancy.id,
    cells: {
      tenant: tenancy.tenantName,
      rent: eur.format(Number(tenancy.monthlyRent)),
      leaseStart: dateFmt.format(tenancy.leaseStart),
      leaseEnd: tenancy.leaseEnd ? (
        dateFmt.format(tenancy.leaseEnd)
      ) : (
        <span className="badge badge-success">Current</span>
      ),
      edit: (
        <Link
          href={`/apartments/${apartment.id}/tenancies/${tenancy.id}/edit`}
          className="link-muted hover:underline"
        >
          Edit
        </Link>
      ),
    },
  }));

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`/apartments/${apartment.id}`} className="link-muted">
            ← Back to apartment
          </Link>
          <h1 className="page-title mt-2">Tenancy history</h1>
          <p className="text-sm text-muted">{apartment.address}</p>
        </div>
        <Link href={`/apartments/${apartment.id}/tenancies/new`} className="btn btn-primary">
          + Add tenancy
        </Link>
      </div>

      <ResponsiveTable
        columns={tenancyColumns}
        rows={tenancyRows}
        emptyMessage="No tenancies recorded yet."
      />
    </div>
  );
}
