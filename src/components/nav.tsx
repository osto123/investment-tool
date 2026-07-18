import Link from "next/link";
import { signOut } from "@/lib/auth";

export function Nav({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <div className="flex items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="text-sm font-semibold">
          Rental Portfolio
        </Link>
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="hidden text-sm text-black/60 sm:inline dark:text-white/60">
              {userEmail}
            </span>
          )}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
