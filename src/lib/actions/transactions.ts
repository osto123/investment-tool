"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { categoryToType, transactionSchema } from "@/lib/validation";

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

function parseTransactionForm(formData: FormData) {
  return transactionSchema.parse({
    category: formData.get("category"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description"),
  });
}

async function saveReceiptIfPresent(formData: FormData, apartmentId: string) {
  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) return null;

  if (file.size > MAX_RECEIPT_BYTES) {
    throw new Error("Receipt file is too large (max 10 MB)");
  }
  if (!ALLOWED_RECEIPT_TYPES.has(file.type)) {
    throw new Error("Receipt must be a PDF or image file");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ref = await getStorage().save({
    buffer,
    fileName: file.name,
    mimeType: file.type,
    keyPrefix: apartmentId,
  });

  return ref;
}

export async function createTransaction(apartmentId: string, formData: FormData) {
  await requireSession();
  const data = parseTransactionForm(formData);
  const receipt = await saveReceiptIfPresent(formData, apartmentId);

  await prisma.transaction.create({
    data: {
      apartmentId,
      type: categoryToType(data.category),
      category: data.category,
      amount: data.amount,
      date: new Date(data.date),
      description: data.description ?? null,
      receiptFileName: receipt?.fileName ?? null,
      receiptStoragePath: receipt?.storagePath ?? null,
      receiptMimeType: receipt?.mimeType ?? null,
      receiptSize: receipt?.size ?? null,
    },
  });

  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath(`/apartments/${apartmentId}/transactions`);
  redirect(`/apartments/${apartmentId}/transactions`);
}

export async function updateTransaction(
  apartmentId: string,
  transactionId: string,
  formData: FormData
) {
  await requireSession();
  const data = parseTransactionForm(formData);
  const newReceipt = await saveReceiptIfPresent(formData, apartmentId);

  const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!existing || existing.apartmentId !== apartmentId) {
    throw new Error("Transaction not found");
  }

  if (newReceipt && existing.receiptStoragePath) {
    await getStorage().delete(existing.receiptStoragePath);
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      type: categoryToType(data.category),
      category: data.category,
      amount: data.amount,
      date: new Date(data.date),
      description: data.description ?? null,
      ...(newReceipt
        ? {
            receiptFileName: newReceipt.fileName,
            receiptStoragePath: newReceipt.storagePath,
            receiptMimeType: newReceipt.mimeType,
            receiptSize: newReceipt.size,
          }
        : {}),
    },
  });

  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath(`/apartments/${apartmentId}/transactions`);
  redirect(`/apartments/${apartmentId}/transactions`);
}

export async function deleteTransaction(apartmentId: string, transactionId: string) {
  await requireSession();

  const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!existing || existing.apartmentId !== apartmentId) {
    throw new Error("Transaction not found");
  }

  if (existing.receiptStoragePath) {
    await getStorage().delete(existing.receiptStoragePath);
  }

  await prisma.transaction.delete({ where: { id: transactionId } });

  revalidatePath(`/apartments/${apartmentId}`);
  revalidatePath(`/apartments/${apartmentId}/transactions`);
  redirect(`/apartments/${apartmentId}/transactions`);
}
