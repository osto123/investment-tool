"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TRANSACTION_CATEGORIES } from "@/lib/validation";

export function TransactionCategoryFilter({ current }: { current?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("category", e.target.value);
    } else {
      params.delete("category");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div>
      <label htmlFor="category" className="field-label">
        Category
      </label>
      <select
        id="category"
        defaultValue={current ?? ""}
        onChange={handleChange}
        className="field-input w-full sm:w-64"
      >
        <option value="">All categories</option>
        {TRANSACTION_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label} ({c.type === "INCOME" ? "income" : "expense"})
          </option>
        ))}
      </select>
    </div>
  );
}
