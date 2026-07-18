import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createTenancy } from "@/lib/actions/tenancies";
import { TenancyForm } from "@/components/tenancy-form";

export default async function NewTenancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const apartment = await prisma.apartment.findUnique({ where: { id } });
  if (!apartment) notFound();

  const boundCreate = createTenancy.bind(null, apartment.id);

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <Link
          href={`/apartments/${apartment.id}/tenancies`}
          className="text-sm text-black/60 dark:text-white/60"
        >
          ← Back to tenancies
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Add tenancy</h1>
      </div>
      <TenancyForm action={boundCreate} submitLabel="Add tenancy" />
    </div>
  );
}
