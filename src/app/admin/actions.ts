"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createAdminSession, deleteAdminSession } from "@/lib/auth/session";

export type LoginState = { error?: string };

const DUMMY_PASSWORD_HASH = `scrypt:${"00".repeat(16)}:${"00".repeat(64)}`;

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const admin = email ? await db.admin.findUnique({ where: { email } }) : null;
  const passwordMatches = await verifyPassword(
    password,
    admin?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!admin || !passwordMatches) {
    return { error: "Invalid email or password." };
  }

  await createAdminSession(admin.id);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await deleteAdminSession();
  redirect("/admin/login");
}
