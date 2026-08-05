import { changePassword } from "@/lib/actions/users";
import { ChangePasswordForm } from "@/components/change-password-form";

const PW_ERROR_MESSAGES: Record<string, string> = {
  "wrong-current": "Current password is incorrect.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ pwError?: string; passwordChanged?: string }>;
}) {
  const { pwError, passwordChanged } = await searchParams;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="page-title mb-6">Account</h1>

      <section className="card max-w-xl space-y-4">
        <h2 className="card-title">Change password</h2>

        {passwordChanged && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            Password changed successfully.
          </p>
        )}

        <ChangePasswordForm
          action={changePassword}
          errorMessage={pwError ? PW_ERROR_MESSAGES[pwError] : undefined}
        />
      </section>
    </div>
  );
}
