import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnedApartment } from "@/lib/ownership";
import { categoryLabel, isTransactionCategoryValue } from "@/lib/validation";
import { TransactionCategoryFilter } from "@/components/transaction-category-filter";

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("fi-FI");

export default async function TransactionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { id } = await params;
  const { category: categoryParam } = await searchParams;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const apartment = await getOwnedApartment(id, session.user.id);
  if (!apartment) notFound();

  const category = categoryParam && isTransactionCategoryValue(categoryParam) ? categoryParam : undefined;

  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where: { apartmentId: id, ...(category ? { category } : {}) },
      orderBy: { date: "desc" },
    }),
    prisma.transaction.count({ where: { apartmentId: id } }),
  ]);

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

      <div className="mb-6">
        <TransactionCategoryFilter current={category} />
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-muted">
          {totalCount === 0 ? "No transactions recorded yet." : "No transactions match this filter."}
        </p>
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
