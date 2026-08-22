import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth/session";

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{admin.email}</span>
        <form action={logoutAction}>
          <button type="submit" className="font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white">Sign out</button>
        </form>
      </div>
      {children}
    </>
  );
}
