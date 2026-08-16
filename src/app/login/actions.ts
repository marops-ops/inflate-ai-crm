"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, expectedSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!checkPassword(password)) {
    return { error: "Incorrect password. Try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, expectedSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
