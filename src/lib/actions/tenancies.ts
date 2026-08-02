"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tenancySchema } from "@/lib/validation";

async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

function parseTenancyForm(formData: FormData) {
  return tenancySchema.parse({
    tenantName: formData.get("tenantName"),
    tenantContact: formData.get("tenantContact"),
    monthlyRent: formData.get("monthlyRent"),
    deposit: formData.get("deposit"),
    leaseStart: formData.get("leaseStart"),
    leaseEnd: formData.get("leaseEnd"),
    notes: formData.get("notes"),
  });
}

export async function createTenancy(apartmentId: string, formData: FormData) {
  const session = await requireSession();
  const data = parseTenancyForm(formData);

  const apartment = await prisma.apartment.findFirst({
    where: { id: apartmentId, ownerId: session.user.id },
  });
  if (!apartment) {
    throw new Error("Apartment not found");
  }

  await prisma.tenancy.create({
    data: {
      apartmentId,
      tenantName: data.tenantName,
      tenantContact: data.tenantContact ?? null,
      monthlyRent: data.monthlyRent,
      deposit: data.deposit ?? null,
      leaseStart: new Date(data.leaseStart),
      leaseEnd: data.leaseEnd ? new Date(data.leaseEnd) : null,
      notes: data.notes ?? null,
    },
  });

  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath(`/apartments/${apartmentId}/tenancies`);
  redirect(`/apartments/${apartmentId}/tenancies`);
}

export async function updateTenancy(
  apartmentId: string,
  tenancyId: string,
  formData: FormData
) {
  const session = await requireSession();
  const data = parseTenancyForm(formData);

  const existing = await prisma.tenancy.findFirst({
    where: { id: tenancyId, apartmentId, apartment: { ownerId: session.user.id } },
  });
  if (!existing) {
    throw new Error("Tenancy not found");
  }

  await prisma.tenancy.update({
    where: { id: tenancyId },
    data: {
      tenantName: data.tenantName,
      tenantContact: data.tenantContact ?? null,
      monthlyRent: data.monthlyRent,
      deposit: data.deposit ?? null,
      leaseStart: new Date(data.leaseStart),
      leaseEnd: data.leaseEnd ? new Date(data.leaseEnd) : null,
      notes: data.notes ?? null,
    },
  });

  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath(`/apartments/${apartmentId}/tenancies`);
  redirect(`/apartments/${apartmentId}/tenancies`);
}

export async function deleteTenancy(apartmentId: string, tenancyId: string) {
  const session = await requireSession();

  const existing = await prisma.tenancy.findFirst({
    where: { id: tenancyId, apartmentId, apartment: { ownerId: session.user.id } },
  });
  if (!existing) {
    throw new Error("Tenancy not found");
  }

  await prisma.tenancy.delete({ where: { id: tenancyId } });
  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath(`/apartments/${apartmentId}/tenancies`);
  redirect(`/apartments/${apartmentId}/tenancies`);
}
