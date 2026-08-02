import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedApartment } from "@/lib/ownership";
import { createTenancy } from "@/lib/actions/tenancies";
import { TenancyForm } from "@/components/tenancy-form";

export default async function NewTenancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const apartment = await getOwnedApartment(id, session.user.id);
  if (!apartment) notFound();

  const boundCreate = createTenancy.bind(null, apartment.id);

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <Link href={`/apartments/${apartment.id}/tenancies`} className="link-muted">
          ← Back to tenancies
        </Link>
        <h1 className="page-title mt-2">Add tenancy</h1>
      </div>
      <TenancyForm action={boundCreate} submitLabel="Add tenancy" />
    </div>
  );
}
