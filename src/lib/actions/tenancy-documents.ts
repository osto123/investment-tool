"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tenancyDocumentSchema } from "@/lib/validation";

async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function addTenancyDocument(
  apartmentId: string,
  tenancyId: string,
  formData: FormData
) {
  const session = await requireSession();

  const tenancy = await prisma.tenancy.findFirst({
    where: { id: tenancyId, apartmentId, apartment: { ownerId: session.user.id } },
  });
  if (!tenancy) {
    throw new Error("Tenancy not found");
  }

  const data = tenancyDocumentSchema.parse({
    label: formData.get("label"),
    url: formData.get("url"),
  });

  await prisma.tenancyDocument.create({
    data: {
      tenancyId,
      label: data.label ?? null,
      url: data.url,
    },
  });

  revalidatePath(`/apartments/${apartmentId}/tenancies/${tenancyId}/edit`);
  revalidatePath(`/apartments/${apartmentId}/tenancies`);
  redirect(`/apartments/${apartmentId}/tenancies/${tenancyId}/edit`);
}

export async function deleteTenancyDocument(
  apartmentId: string,
  tenancyId: string,
  documentId: string
) {
  const session = await requireSession();

  const document = await prisma.tenancyDocument.findFirst({
    where: {
      id: documentId,
      tenancyId,
      tenancy: { apartmentId, apartment: { ownerId: session.user.id } },
    },
  });
  if (!document) {
    throw new Error("Document not found");
  }

  await prisma.tenancyDocument.delete({ where: { id: documentId } });

  revalidatePath(`/apartments/${apartmentId}/tenancies/${tenancyId}/edit`);
  revalidatePath(`/apartments/${apartmentId}/tenancies`);
  redirect(`/apartments/${apartmentId}/tenancies/${tenancyId}/edit`);
}
