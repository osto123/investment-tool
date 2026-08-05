"use client";

import { useState } from "react";

export function ConfirmDeleteButton({
  action,
  label = "Delete",
  confirmText = "Are you sure?",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="btn btn-danger-outline">
        {label}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <span className="text-sm text-red-700 dark:text-red-400">{confirmText}</span>
      <div className="flex items-center gap-2">
        <button type="submit" className="btn btn-danger">
          Yes, delete
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
