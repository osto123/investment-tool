const inputClass = "field-input";
const labelClass = "field-label";

export function ChangePasswordForm({
  action,
  errorMessage,
}: {
  action: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
}) {
  return (
    <form action={action} className="space-y-4 max-w-xl">
      {errorMessage && (
        <p className="banner-danger">{errorMessage}</p>
      )}

      <div className="space-y-1">
        <label htmlFor="currentPassword" className={labelClass}>
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="newPassword" className={labelClass}>
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Change password
      </button>
    </form>
  );
}
