import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { categoryLabel } from "@/lib/validation";

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("fi-FI");

export default async function TransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const apartment = await prisma.apartment.findUnique({ where: { id } });
  if (!apartment) notFound();

  const transactions = await prisma.transaction.findMany({
    where: { apartmentId: id },
    orderBy: { date: "desc" },
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
          <h1 className="mt-2 text-xl font-semibold">Transactions</h1>
          <p className="text-sm text-black/60 dark:text-white/60">{apartment.address}</p>
        </div>
        <Link
          href={`/apartments/${apartment.id}/transactions/new`}
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          + Add transaction
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">No transactions recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-black/60 dark:border-white/15 dark:text-white/60">
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
                <tr key={tx.id} className="border-b border-black/5 last:border-0 dark:border-white/10">
                  <td className="px-4 py-2">{dateFmt.format(tx.date)}</td>
                  <td className="px-4 py-2">{categoryLabel(tx.category)}</td>
                  <td className="px-4 py-2">{tx.description ?? "—"}</td>
                  <td className="px-4 py-2">
                    {tx.receiptStoragePath ? (
                      <a
                        href={`/api/receipts/${tx.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-black/60 hover:underline dark:text-white/60"
                      >
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    className={`px-4 py-2 text-right ${
                      tx.type === "INCOME" ? "text-green-700 dark:text-green-400" : ""
                    }`}
                  >
                    {tx.type === "EXPENSE" ? "−" : "+"}
                    {eur.format(Number(tx.amount))}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/apartments/${apartment.id}/transactions/${tx.id}/edit`}
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
