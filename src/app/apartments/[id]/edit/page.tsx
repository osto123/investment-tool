import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOwnedApartment } from "@/lib/ownership";
import { updateApartment } from "@/lib/actions/apartments";
import { ApartmentForm } from "@/components/apartment-form";

export default async function EditApartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const apartment = await getOwnedApartment(id, session.user.id);
  if (!apartment) notFound();

  const boundUpdate = updateApartment.bind(null, apartment.id);

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <Link href={`/apartments/${apartment.id}`} className="link-muted">
          ← Back to apartment
        </Link>
        <h1 className="page-title mt-2">Edit apartment</h1>
      </div>
      <ApartmentForm
        action={boundUpdate}
        submitLabel="Save changes"
        defaults={{
          address: apartment.address,
          housingCompanyName: apartment.housingCompanyName,
          sizeSqm: apartment.sizeSqm.toString(),
          purchasePrice: apartment.purchasePrice.toString(),
          purchaseDate: apartment.purchaseDate.toISOString().slice(0, 10),
          maintenanceFeeHoito: apartment.maintenanceFeeHoito?.toString(),
          maintenanceFeePaaoma: apartment.maintenanceFeePaaoma?.toString(),
          notes: apartment.notes ?? undefined,
        }}
      />
    </div>
  );
}
