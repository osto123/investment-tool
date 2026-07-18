import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("fi-FI");

export default async function TenanciesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const apartment = await prisma.apartment.findUnique({ where: { id } });
  if (!apartment) notFound();

  const tenancies = await prisma.tenancy.findMany({
    where: { apartmentId: id },
    orderBy: { leaseStart: "desc" },
  });

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href={`/apartments/${apartment.id}`}
            className="text-sm text-black/60 dark:text-white/60"
          >
            ← Back to apartment
          </Link>
          <h1 className="mt-2 text-xl font-semibold">Tenancy history</h1>
          <p className="text-sm text-black/60 dark:text-white/60">{apartment.address}</p>
        </div>
        <Link
          href={`/apartments/${apartment.id}/tenancies/new`}
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          + Add tenancy
        </Link>
      </div>

      {tenancies.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">No tenancies recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-black/60 dark:border-white/15 dark:text-white/60">
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
                <tr key={tenancy.id} className="border-b border-black/5 last:border-0 dark:border-white/10">
                  <td className="px-4 py-2">{tenancy.tenantName}</td>
                  <td className="px-4 py-2">{eur.format(Number(tenancy.monthlyRent))}</td>
                  <td className="px-4 py-2">{dateFmt.format(tenancy.leaseStart)}</td>
                  <td className="px-4 py-2">
                    {tenancy.leaseEnd ? (
                      dateFmt.format(tenancy.leaseEnd)
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-950 dark:text-green-300">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/apartments/${apartment.id}/tenancies/${tenancy.id}/edit`}
                      className="text-black/60 hover:underline dark:text-white/60"
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
