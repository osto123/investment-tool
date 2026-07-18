import Link from "next/link";
import { ApartmentForm } from "@/components/apartment-form";
import { createApartment } from "@/lib/actions/apartments";

export default function NewApartmentPage() {
  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-black/60 dark:text-white/60">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Add apartment</h1>
      </div>
      <ApartmentForm action={createApartment} submitLabel="Create apartment" />
    </div>
  );
}
