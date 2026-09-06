"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  MAX_RECEIPT_BYTES,
  resolveReceiptMimeType,
  TRANSACTION_CATEGORIES,
} from "@/lib/validation";
import type { TransactionFormState } from "@/lib/actions/transactions";

const inputClass = "field-input";
const labelClass = "field-label";

export type TransactionFormDefaults = {
  category?: string;
  amount?: string;
  date?: string;
  description?: string;
};

type UploadedReceipt = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export function TransactionForm({
  action,
  apartmentId,
  directUpload,
  defaults,
  submitLabel,
  currentReceiptName,
}: {
  action: (prevState: TransactionFormState, formData: FormData) => Promise<TransactionFormState>;
  apartmentId: string;
  // true in production (upload straight to Vercel Blob); false in local dev
  // (post the file to the receipts route, which writes it to disk).
  directUpload: boolean;
  defaults?: TransactionFormDefaults;
  submitLabel: string;
  currentReceiptName?: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [uploading, setUploading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  // Reuse an already-uploaded receipt if the form is resubmitted (e.g. after a
  // validation error) so the same file isn't uploaded a second time.
  const lastUpload = useRef<{ key: string; ref: UploadedReceipt } | null>(null);

  const busy = pending || uploading;
  const error = clientError ?? state?.error;

  const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

  async function uploadReceipt(file: File): Promise<UploadedReceipt | null> {
    if (lastUpload.current?.key === fileKey(file)) return lastUpload.current.ref;

    if (file.size > MAX_RECEIPT_BYTES) {
      setClientError("Receipt file is too large (max 10 MB)");
      return null;
    }
    const mimeType = resolveReceiptMimeType(file.name, file.type);
    if (!mimeType) {
      setClientError("Receipt must be a PDF or image file");
      return null;
    }

    const handleUploadUrl = `/api/apartments/${apartmentId}/receipts`;

    try {
      let ref: UploadedReceipt;

      if (directUpload) {
        // Straight to Vercel Blob — the file bytes never touch this app, which
        // is the only way it reaches storage from Android Chrome. The route at
        // handleUploadUrl just authorizes the upload and returns a token.
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const pathname = `${apartmentId}/${crypto.randomUUID()}-${safeName}`;
        const blob = await upload(pathname, file, {
          access: "private",
          contentType: mimeType,
          handleUploadUrl,
        });
        ref = {
          storagePath: blob.pathname,
          fileName: file.name,
          mimeType: blob.contentType || mimeType,
          size: file.size,
        };
      } else {
        // Local dev: post the file to the route, which writes it to disk.
        const body = new FormData();
        body.set("file", file);
        const res = await fetch(handleUploadUrl, { method: "POST", body });
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as { error?: string } | null;
          setClientError(payload?.error ?? "Receipt upload failed — please try again.");
          return null;
        }
        ref = (await res.json()) as UploadedReceipt;
      }

      lastUpload.current = { key: fileKey(file), ref };
      return ref;
    } catch (err) {
      setClientError(
        err instanceof Error && err.message
          ? `Receipt upload failed: ${err.message}`
          : "Receipt upload failed — check your connection and try again."
      );
      return null;
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (busy) {
      event.preventDefault();
      return;
    }

    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("receipt") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    // No receipt attached — let the form post to the Server Action as usual.
    if (!file || file.size === 0) return;

    // Upload the file on its own request first, then submit the form carrying
    // only the stored-file reference (see api/apartments/[id]/receipts).
    event.preventDefault();
    setClientError(null);
    setUploading(true);
    const ref = await uploadReceipt(file);
    setUploading(false);
    if (!ref) return;

    const data = new FormData(form);
    data.delete("receipt");
    data.set("receiptStoragePath", ref.storagePath);
    data.set("receiptFileName", ref.fileName);
    data.set("receiptMimeType", ref.mimeType);
    data.set("receiptSize", String(ref.size));

    startTransition(() => formAction(data));
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {error && <p className="banner-danger">{error}</p>}
      <div className="space-y-1">
        <label htmlFor="category" className={labelClass}>
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue={defaults?.category ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Select a category
          </option>
          {TRANSACTION_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label} ({c.type === "INCOME" ? "income" : "expense"})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="amount" className={labelClass}>
            Amount (€)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaults?.amount}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="date" className={labelClass}>
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaults?.date}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <input
          id="description"
          name="description"
          defaultValue={defaults?.description}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="receipt" className={labelClass}>
          Receipt (PDF or image, optional)
        </label>
        {currentReceiptName && (
          <p className="text-xs text-muted-2">
            Current file: {currentReceiptName}. Uploading a new one replaces it.
          </p>
        )}
        <input
          id="receipt"
          name="receipt"
          type="file"
          accept="application/pdf,image/*"
          className={inputClass}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {uploading ? "Uploading receipt…" : pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
