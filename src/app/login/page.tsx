import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function authenticate(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/dashboard",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/login?error=1");
      }
      throw err;
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <form action={authenticate} className="card w-full max-w-sm space-y-4">
        <h1 className="page-title !text-2xl">Sign in</h1>
        <p className="text-sm text-muted">Sign in to manage the family&apos;s rental portfolio</p>

        {error && (
          <p className="banner-danger">Invalid email or password.</p>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="field-label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="field-input"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="field-input"
          />
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Sign in
        </button>
      </form>
    </div>
  );
}
