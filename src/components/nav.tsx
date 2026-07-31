import Link from "next/link";
import { signOut } from "@/lib/auth";

export function Nav({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="flex items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="text-sm font-bold tracking-tight text-purple">
          Rental Portfolio
        </Link>
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="hidden text-sm text-muted sm:inline">{userEmail}</span>
          )}
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
