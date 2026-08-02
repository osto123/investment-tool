import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnedApartment } from "@/lib/ownership";
import { categoryLabel } from "@/lib/validation";

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("fi-FI");

export default async function TransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const apartment = await getOwnedApartment(id, session.user.id);
  if (!apartment) notFound();

  const transactions = await prisma.transaction.findMany({
    where: { apartmentId: id },
    orderBy: { date: "desc" },
  });

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/apartments/${apartment.id}`} className="link-muted">
            ← Back to apartment
          </Link>
          <h1 className="page-title mt-2">Transactions</h1>
          <p className="text-sm text-muted">{apartment.address}</p>
        </div>
        <Link href={`/apartments/${apartment.id}/transactions/new`} className="btn btn-primary">
          + Add transaction
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-muted">No transactions recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium">Receipt</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2">{dateFmt.format(tx.date)}</td>
                  <td className="px-4 py-2">{categoryLabel(tx.category)}</td>
                  <td className="px-4 py-2">{tx.description ?? "—"}</td>
                  <td className="px-4 py-2">
                    {tx.receiptStoragePath ? (
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
                    )}
                  </td>
                  <td className={`px-4 py-2 text-right ${tx.type === "INCOME" ? "amount-positive" : ""}`}>
                    {tx.type === "EXPENSE" ? "−" : "+"}
                    {eur.format(Number(tx.amount))}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/apartments/${apartment.id}/transactions/${tx.id}/edit`}
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
