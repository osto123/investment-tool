import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateTenancy, deleteTenancy } from "@/lib/actions/tenancies";
import { addTenancyDocument, deleteTenancyDocument } from "@/lib/actions/tenancy-documents";
import { TenancyForm } from "@/components/tenancy-form";
import { TenancyDocuments } from "@/components/tenancy-documents";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export default async function EditTenancyPage({
  params,
}: {
  params: Promise<{ id: string; tenancyId: string }>;
}) {
  const { id, tenancyId } = await params;

  const tenancy = await prisma.tenancy.findUnique({
    where: { id: tenancyId },
    include: { documents: { orderBy: { createdAt: "asc" } } },
  });
  if (!tenancy || tenancy.apartmentId !== id) notFound();

  const boundUpdate = updateTenancy.bind(null, id, tenancyId);
  const boundDelete = deleteTenancy.bind(null, id, tenancyId);
  const boundAddDocument = addTenancyDocument.bind(null, id, tenancyId);

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href={`/apartments/${id}/tenancies`} className="link-muted">
            ← Back to tenancies
          </Link>
          <h1 className="page-title mt-2">Edit tenancy</h1>
        </div>
        <ConfirmDeleteButton
          action={boundDelete}
          label="Delete tenancy"
          confirmText="Delete this tenancy record?"
        />
      </div>
      <TenancyForm
        action={boundUpdate}
        submitLabel="Save changes"
        defaults={{
          tenantName: tenancy.tenantName,
          tenantContact: tenancy.tenantContact ?? undefined,
          monthlyRent: tenancy.monthlyRent.toString(),
          deposit: tenancy.deposit?.toString(),
          leaseStart: tenancy.leaseStart.toISOString().slice(0, 10),
          leaseEnd: tenancy.leaseEnd?.toISOString().slice(0, 10),
          notes: tenancy.notes ?? undefined,
        }}
      />

      <div className="mt-10 max-w-xl border-t border-border pt-6">
        <TenancyDocuments
          documents={tenancy.documents}
          addAction={boundAddDocument}
          deleteAction={(documentId) => deleteTenancyDocument.bind(null, id, tenancyId, documentId)}
        />
      </div>
    </div>
  );
}
