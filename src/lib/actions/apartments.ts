"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apartmentSchema } from "@/lib/validation";

async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

function parseApartmentForm(formData: FormData) {
  return apartmentSchema.parse({
    address: formData.get("address"),
    housingCompanyName: formData.get("housingCompanyName"),
    sizeSqm: formData.get("sizeSqm"),
    purchasePrice: formData.get("purchasePrice"),
    purchaseDate: formData.get("purchaseDate"),
    maintenanceFeeHoito: formData.get("maintenanceFeeHoito"),
    maintenanceFeePaaoma: formData.get("maintenanceFeePaaoma"),
    notes: formData.get("notes"),
  });
}

export async function createApartment(formData: FormData) {
  const session = await requireSession();
  const data = parseApartmentForm(formData);

  const apartment = await prisma.apartment.create({
    data: {
      ownerId: session.user.id,
      address: data.address,
      housingCompanyName: data.housingCompanyName,
      sizeSqm: data.sizeSqm,
      purchasePrice: data.purchasePrice,
      purchaseDate: new Date(data.purchaseDate),
      maintenanceFeeHoito: data.maintenanceFeeHoito ?? null,
      maintenanceFeePaaoma: data.maintenanceFeePaaoma ?? null,
      notes: data.notes ?? null,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/apartments/${apartment.id}`);
}

export async function updateApartment(id: string, formData: FormData) {
  const session = await requireSession();
  const data = parseApartmentForm(formData);

  const { count } = await prisma.apartment.updateMany({
    where: { id, ownerId: session.user.id },
    data: {
      address: data.address,
      housingCompanyName: data.housingCompanyName,
      sizeSqm: data.sizeSqm,
      purchasePrice: data.purchasePrice,
      purchaseDate: new Date(data.purchaseDate),
      maintenanceFeeHoito: data.maintenanceFeeHoito ?? null,
      maintenanceFeePaaoma: data.maintenanceFeePaaoma ?? null,
      notes: data.notes ?? null,
    },
  });
  if (count === 0) {
    throw new Error("Apartment not found");
  }

  revalidatePath("/dashboard");
  revalidatePath(`/apartments/${id}`);
  redirect(`/apartments/${id}`);
}

export async function deleteApartment(id: string) {
  const session = await requireSession();
  const { count } = await prisma.apartment.deleteMany({
    where: { id, ownerId: session.user.id },
  });
  if (count === 0) {
    throw new Error("Apartment not found");
  }
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
