import { redirect } from "next/navigation";
import { LoginForm } from "@/app/admin/login/login-form";
import { getCurrentAdmin } from "@/lib/auth/session";

export const metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Admin sign in</h1>
      <p className="mt-2 mb-6 text-sm text-zinc-600 dark:text-zinc-400">Use the owner account configured for this store.</p>
      <LoginForm />
    </div>
  );
}
