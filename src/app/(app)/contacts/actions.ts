"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { contacts, leads } from "@/db/schema";

function fieldOrNull(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function relationIdOrNull(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 && value !== "none" ? value : null;
}

export async function createContact(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  if (!firstName) return { error: "First name is required." };

  const db = getDb();
  const [contact] = await db
    .insert(contacts)
    .values({
      firstName,
      lastName: fieldOrNull(formData, "lastName"),
      email: fieldOrNull(formData, "email"),
      phone: fieldOrNull(formData, "phone"),
      jobTitle: fieldOrNull(formData, "jobTitle"),
      companyId: relationIdOrNull(formData, "companyId"),
      notes: fieldOrNull(formData, "notes"),
    })
    .returning({ id: contacts.id });

  revalidatePath("/contacts");
  revalidatePath("/companies");

  const leadId = relationIdOrNull(formData, "leadId");
  if (leadId) {
    await db.update(leads).set({ contactId: contact.id }).where(eq(leads.id, leadId));
    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    redirect(`/leads/${leadId}`);
  }

  redirect(`/contacts/${contact.id}`);
}

export async function updateContact(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const id = String(formData.get("id") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  if (!id) return { error: "Missing contact id." };
  if (!firstName) return { error: "First name is required." };

  const db = getDb();
  await db
    .update(contacts)
    .set({
      firstName,
      lastName: fieldOrNull(formData, "lastName"),
      email: fieldOrNull(formData, "email"),
      phone: fieldOrNull(formData, "phone"),
      jobTitle: fieldOrNull(formData, "jobTitle"),
      companyId: relationIdOrNull(formData, "companyId"),
      notes: fieldOrNull(formData, "notes"),
    })
    .where(eq(contacts.id, id));

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/companies");
  redirect(`/contacts/${id}`);
}

export async function deleteContact(id: string) {
  const db = getDb();
  await db.delete(contacts).where(eq(contacts.id, id));
  revalidatePath("/contacts");
  revalidatePath("/companies");
  redirect("/contacts");
}
