const inputClass =
  "w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent";
const labelClass = "block text-sm font-medium";

export type ApartmentFormDefaults = {
  address?: string;
  housingCompanyName?: string;
  sizeSqm?: string;
  purchasePrice?: string;
  purchaseDate?: string;
  maintenanceFeeHoito?: string;
  maintenanceFeePaaoma?: string;
  notes?: string;
};

export function ApartmentForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: ApartmentFormDefaults;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4 max-w-xl">
      <div className="space-y-1">
        <label htmlFor="address" className={labelClass}>
          Address
        </label>
        <input
          id="address"
          name="address"
          required
          defaultValue={defaults?.address}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="housingCompanyName" className={labelClass}>
          Housing company name
        </label>
        <input
          id="housingCompanyName"
          name="housingCompanyName"
          required
          defaultValue={defaults?.housingCompanyName}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="sizeSqm" className={labelClass}>
            Size (m²)
          </label>
          <input
            id="sizeSqm"
            name="sizeSqm"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaults?.sizeSqm}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="purchasePrice" className={labelClass}>
            Purchase price (€)
          </label>
          <input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaults?.purchasePrice}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="purchaseDate" className={labelClass}>
          Purchase date
        </label>
        <input
          id="purchaseDate"
          name="purchaseDate"
          type="date"
          required
          defaultValue={defaults?.purchaseDate}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="maintenanceFeeHoito" className={labelClass}>
            Hoitovastike (€/mo)
          </label>
          <input
            id="maintenanceFeeHoito"
            name="maintenanceFeeHoito"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.maintenanceFeeHoito}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="maintenanceFeePaaoma" className={labelClass}>
            Pääomavastike (€/mo)
          </label>
          <input
            id="maintenanceFeePaaoma"
            name="maintenanceFeePaaoma"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.maintenanceFeePaaoma}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaults?.notes}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        {submitLabel}
      </button>
    </form>
  );
}
