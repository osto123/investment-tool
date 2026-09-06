"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import type { StoredFileRef } from "@/lib/storage";
import {
  ALLOWED_RECEIPT_MIME_TYPES,
  categoryToType,
  MAX_RECEIPT_BYTES,
  transactionSchema,
} from "@/lib/validation";

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

// The receipt file itself is uploaded separately, before this action runs, via
// POST /api/apartments/[id]/receipts (see that route for why). Here we only
// receive the resulting stored-file reference as plain form fields.
function receiptRefFromForm(formData: FormData, apartmentId: string): StoredFileRef | null {
  const storagePath = formData.get("receiptStoragePath");
  if (typeof storagePath !== "string" || storagePath.trim() === "") return null;

  const fileName = formData.get("receiptFileName");
  const mimeType = formData.get("receiptMimeType");
  const rawSize = formData.get("receiptSize");
  if (
    typeof fileName !== "string" ||
    typeof mimeType !== "string" ||
    typeof rawSize !== "string"
  ) {
    throw new TransactionFormError("Receipt upload was incomplete — please try again");
  }

  // The upload route stores every receipt under the apartment's key prefix.
  // Reject anything outside it so a caller can't attach another apartment's blob.
  if (!storagePath.startsWith(`${apartmentId}/`)) {
    throw new TransactionFormError("Invalid receipt reference");
  }

  const size = Number(rawSize);
  if (!Number.isFinite(size) || size <= 0) {
    throw new TransactionFormError("Receipt upload was incomplete — please try again");
  }
  if (size > MAX_RECEIPT_BYTES) {
    throw new TransactionFormError("Receipt file is too large (max 10 MB)");
  }
  if (!ALLOWED_RECEIPT_MIME_TYPES.includes(mimeType)) {
    throw new TransactionFormError("Receipt must be a PDF or image file");
  }

  return { storagePath, fileName, mimeType, size };
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
    receipt = receiptRefFromForm(formData, apartmentId);
  } catch (err) {
    if (err instanceof TransactionFormError) return { error: err.message };
    console.error("createTransaction: invalid submission", err);
    return { error: "Something went wrong saving the transaction. Please try again." };
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
    newReceipt = receiptRefFromForm(formData, apartmentId);
  } catch (err) {
    if (err instanceof TransactionFormError) return { error: err.message };
    console.error("updateTransaction: invalid submission", err);
    return { error: "Something went wrong saving the transaction. Please try again." };
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
