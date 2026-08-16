"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { companies } from "@/db/schema";

function fieldOrNull(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function createCompany(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Company name is required." };

  const db = getDb();
  const [company] = await db
    .insert(companies)
    .values({
      name,
      website: fieldOrNull(formData, "website"),
      industry: fieldOrNull(formData, "industry"),
      phone: fieldOrNull(formData, "phone"),
      address: fieldOrNull(formData, "address"),
      notes: fieldOrNull(formData, "notes"),
    })
    .returning({ id: companies.id });

  revalidatePath("/companies");
  redirect(`/companies/${company.id}`);
}

export async function updateCompany(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: "Missing company id." };
  if (!name) return { error: "Company name is required." };

  const db = getDb();
  await db
    .update(companies)
    .set({
      name,
      website: fieldOrNull(formData, "website"),
      industry: fieldOrNull(formData, "industry"),
      phone: fieldOrNull(formData, "phone"),
      address: fieldOrNull(formData, "address"),
      notes: fieldOrNull(formData, "notes"),
    })
    .where(eq(companies.id, id));

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  redirect(`/companies/${id}`);
}

export async function deleteCompany(id: string) {
  const db = getDb();
  await db.delete(companies).where(eq(companies.id, id));
  revalidatePath("/companies");
  redirect("/companies");
}
