import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createTransaction } from "@/lib/actions/transactions";
import { TransactionForm } from "@/components/transaction-form";

export default async function NewTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const apartment = await prisma.apartment.findUnique({ where: { id } });
  if (!apartment) notFound();

  const boundCreate = createTransaction.bind(null, apartment.id);

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <Link href={`/apartments/${apartment.id}/transactions`} className="link-muted">
          ← Back to transactions
        </Link>
        <h1 className="page-title mt-2">Add transaction</h1>
      </div>
      <TransactionForm action={boundCreate} submitLabel="Add transaction" />
    </div>
  );
}
