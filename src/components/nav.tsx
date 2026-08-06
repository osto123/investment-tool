import Link from "next/link";
import { signOut } from "@/lib/auth";

export function Nav({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6 sm:py-3">
        <Link href="/dashboard" className="text-sm font-bold tracking-tight text-accent">
          Rental Portfolio
        </Link>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {userEmail && (
            <span className="hidden text-sm text-muted sm:inline">{userEmail}</span>
          )}
          <Link
            href="/account"
            className="inline-flex items-center py-2 text-sm text-muted hover:text-foreground"
          >
            Account
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="btn btn-secondary">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
