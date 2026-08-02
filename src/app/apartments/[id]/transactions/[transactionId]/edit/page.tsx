import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateTransaction, deleteTransaction } from "@/lib/actions/transactions";
import { TransactionForm } from "@/components/transaction-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string; transactionId: string }>;
}) {
  const { id, transactionId } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, apartmentId: id, apartment: { ownerId: session.user.id } },
  });
  if (!transaction) notFound();

  const boundUpdate = updateTransaction.bind(null, id, transactionId);
  const boundDelete = deleteTransaction.bind(null, id, transactionId);

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href={`/apartments/${id}/transactions`} className="link-muted">
            ← Back to transactions
          </Link>
          <h1 className="page-title mt-2">Edit transaction</h1>
        </div>
        <ConfirmDeleteButton
          action={boundDelete}
          label="Delete transaction"
          confirmText="Delete this transaction and its receipt?"
        />
      </div>
      <TransactionForm
        action={boundUpdate}
        submitLabel="Save changes"
        currentReceiptName={transaction.receiptFileName}
        defaults={{
          category: transaction.category,
          amount: transaction.amount.toString(),
          date: transaction.date.toISOString().slice(0, 10),
          description: transaction.description ?? undefined,
        }}
      />
    </div>
  );
}
