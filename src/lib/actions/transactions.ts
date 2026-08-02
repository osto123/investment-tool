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
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type TransactionFormState = { error?: string };

class TransactionFormError extends Error {}

async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

function parseTransactionForm(formData: FormData) {
  const parsed = transactionSchema.safeParse({
    category: formData.get("category"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    throw new TransactionFormError(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  return parsed.data;
}

async function saveReceiptIfPresent(formData: FormData, apartmentId: string) {
  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) return null;

  if (file.size > MAX_RECEIPT_BYTES) {
    throw new TransactionFormError("Receipt file is too large (max 10 MB)");
  }
  if (!ALLOWED_RECEIPT_TYPES.has(file.type)) {
    throw new TransactionFormError("Receipt must be a PDF or image file");
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

export async function createTransaction(
  apartmentId: string,
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const session = await requireSession();

  const apartment = await prisma.apartment.findFirst({
    where: { id: apartmentId, ownerId: session.user.id },
  });
  if (!apartment) {
    throw new Error("Apartment not found");
  }

  let data, receipt;
  try {
    data = parseTransactionForm(formData);
    receipt = await saveReceiptIfPresent(formData, apartmentId);
  } catch (err) {
    if (err instanceof TransactionFormError) return { error: err.message };
    console.error("createTransaction: failed to save receipt", err);
    return {
      error: `Failed to save receipt: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }

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
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const session = await requireSession();

  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, apartmentId, apartment: { ownerId: session.user.id } },
  });
  if (!existing) {
    throw new Error("Transaction not found");
  }

  let data, newReceipt;
  try {
    data = parseTransactionForm(formData);
    newReceipt = await saveReceiptIfPresent(formData, apartmentId);
  } catch (err) {
    if (err instanceof TransactionFormError) return { error: err.message };
    console.error("updateTransaction: failed to save receipt", err);
    return {
      error: `Failed to save receipt: ${err instanceof Error ? err.message : "unknown error"}`,
    };
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
  const session = await requireSession();

  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, apartmentId, apartment: { ownerId: session.user.id } },
  });
  if (!existing) {
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
