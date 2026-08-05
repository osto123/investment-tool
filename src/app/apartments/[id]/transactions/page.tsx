import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOwnedApartment } from "@/lib/ownership";
import { categoryLabel, isTransactionCategoryValue } from "@/lib/validation";
import { TransactionCategoryFilter } from "@/components/transaction-category-filter";
import { ResponsiveTable, type ResponsiveTableColumn, type ResponsiveTableRow } from "@/components/responsive-table";

const eur = new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" });
const dateFmt = new Intl.DateTimeFormat("fi-FI");

const transactionColumns: ResponsiveTableColumn[] = [
  { key: "date", header: "Date", primary: true },
  { key: "category", header: "Category" },
  { key: "description", header: "Description" },
  { key: "receipt", header: "Receipt" },
  { key: "amount", header: "Amount", align: "right" },
  { key: "edit", header: "", align: "right", hideLabel: true },
];

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

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      <ResponsiveTable
        columns={transactionColumns}
        rows={transactionRows}
        emptyMessage={totalCount === 0 ? "No transactions recorded yet." : "No transactions match this filter."}
      />
    </div>
  );
}
