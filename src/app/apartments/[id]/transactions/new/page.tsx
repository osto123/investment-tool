import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedApartment } from "@/lib/ownership";
import { createTransaction } from "@/lib/actions/transactions";
import { TransactionForm } from "@/components/transaction-form";

export default async function NewTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const apartment = await getOwnedApartment(id, session.user.id);
  if (!apartment) notFound();

  const boundCreate = createTransaction.bind(null, apartment.id);

  return (
    <div className="p-4 sm:p-6">
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
