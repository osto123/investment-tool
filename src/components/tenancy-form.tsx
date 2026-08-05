const inputClass = "field-input";
const labelClass = "field-label";

export type TenancyFormDefaults = {
  tenantName?: string;
  tenantContact?: string;
  monthlyRent?: string;
  deposit?: string;
  leaseStart?: string;
  leaseEnd?: string;
  notes?: string;
};

export function TenancyForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: TenancyFormDefaults;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4 max-w-xl">
      <div className="space-y-1">
        <label htmlFor="tenantName" className={labelClass}>
          Tenant name
        </label>
        <input
          id="tenantName"
          name="tenantName"
          required
          defaultValue={defaults?.tenantName}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="tenantContact" className={labelClass}>
          Contact (phone/email)
        </label>
        <input
          id="tenantContact"
          name="tenantContact"
          defaultValue={defaults?.tenantContact}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="monthlyRent" className={labelClass}>
            Monthly rent (€)
          </label>
          <input
            id="monthlyRent"
            name="monthlyRent"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaults?.monthlyRent}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="deposit" className={labelClass}>
            Deposit (€)
          </label>
          <input
            id="deposit"
            name="deposit"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.deposit}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="leaseStart" className={labelClass}>
            Lease start
          </label>
          <input
            id="leaseStart"
            name="leaseStart"
            type="date"
            required
            defaultValue={defaults?.leaseStart}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="leaseEnd" className={labelClass}>
            Lease end
          </label>
          <input
            id="leaseEnd"
            name="leaseEnd"
            type="date"
            defaultValue={defaults?.leaseEnd}
            className={inputClass}
          />
          <p className="text-xs text-muted-2">Leave empty for an ongoing tenancy.</p>
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

      <button type="submit" className="btn btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
