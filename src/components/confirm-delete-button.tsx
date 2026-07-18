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
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 dark:border-red-900 dark:text-red-400"
      >
        {label}
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <span className="text-sm text-red-700 dark:text-red-400">{confirmText}</span>
      <button
        type="submit"
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
      >
        Yes, delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20"
      >
        Cancel
      </button>
    </form>
  );
}
