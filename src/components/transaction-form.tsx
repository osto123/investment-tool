import { TRANSACTION_CATEGORIES } from "@/lib/validation";

const inputClass = "field-input";
const labelClass = "field-label";

export type TransactionFormDefaults = {
  category?: string;
  amount?: string;
  date?: string;
  description?: string;
};

export function TransactionForm({
  action,
  defaults,
  submitLabel,
  currentReceiptName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: TransactionFormDefaults;
  submitLabel: string;
  currentReceiptName?: string | null;
}) {
  return (
    <form action={action} encType="multipart/form-data" className="space-y-4 max-w-xl">
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

      <div className="grid grid-cols-2 gap-4">
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

      <button type="submit" className="btn btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
