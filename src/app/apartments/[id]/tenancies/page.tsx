import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnedApartment } from "@/lib/ownership";

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("fi-FI");

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

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
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

      {tenancies.length === 0 ? (
        <p className="text-sm text-muted">No tenancies recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Tenant</th>
                <th className="px-4 py-2 font-medium">Rent</th>
                <th className="px-4 py-2 font-medium">Lease start</th>
                <th className="px-4 py-2 font-medium">Lease end</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {tenancies.map((tenancy) => (
                <tr key={tenancy.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2">{tenancy.tenantName}</td>
                  <td className="px-4 py-2">{eur.format(Number(tenancy.monthlyRent))}</td>
                  <td className="px-4 py-2">{dateFmt.format(tenancy.leaseStart)}</td>
                  <td className="px-4 py-2">
                    {tenancy.leaseEnd ? (
                      dateFmt.format(tenancy.leaseEnd)
                    ) : (
                      <span className="badge badge-success">Current</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/apartments/${apartment.id}/tenancies/${tenancy.id}/edit`}
                      className="link-muted hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
