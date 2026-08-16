"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, leadActivities } from "@/db/schema";
import type { Stage } from "@/lib/pipeline";
import { stageLabel } from "@/lib/pipeline";

function fieldOrNull(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function relationIdOrNull(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 && value !== "none" ? value : null;
}

function revalidateLead(id?: string) {
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
  revalidatePath("/companies");
  revalidatePath("/contacts");
  if (id) revalidatePath(`/leads/${id}`);
}

export async function createLead(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Lead title is required." };

  const stage = (String(formData.get("stage") ?? "new") || "new") as Stage;
  const valueRaw = String(formData.get("value") ?? "0").trim();
  const value = valueRaw.length > 0 ? valueRaw : "0";

  const db = getDb();
  const [lead] = await db
    .insert(leads)
    .values({
      title,
      contactId: relationIdOrNull(formData, "contactId"),
      companyId: relationIdOrNull(formData, "companyId"),
      stage,
      value,
      source: fieldOrNull(formData, "source"),
      owner: fieldOrNull(formData, "owner"),
    })
    .returning({ id: leads.id });

  await db.insert(leadActivities).values({
    leadId: lead.id,
    type: "created",
    body: `Lead created in ${stageLabel(stage)}.`,
  });

  revalidateLead(lead.id);
  redirect(`/leads/${lead.id}`);
}

export async function updateLead(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id) return { error: "Missing lead id." };
  if (!title) return { error: "Lead title is required." };

  const valueRaw = String(formData.get("value") ?? "0").trim();
  const value = valueRaw.length > 0 ? valueRaw : "0";

  const db = getDb();
  await db
    .update(leads)
    .set({
      title,
      contactId: relationIdOrNull(formData, "contactId"),
      companyId: relationIdOrNull(formData, "companyId"),
      value,
      source: fieldOrNull(formData, "source"),
      owner: fieldOrNull(formData, "owner"),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id));

  revalidateLead(id);
  redirect(`/leads/${id}`);
}

export async function deleteLead(id: string) {
  const db = getDb();
  await db.delete(leads).where(eq(leads.id, id));
  revalidateLead();
  redirect("/leads");
}

export async function changeLeadStage(id: string, stage: Stage) {
  const db = getDb();
  const won = stage === "won";

  await db
    .update(leads)
    .set({
      stage,
      status: won ? "won" : "active",
      closedAt: won ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id));

  await db.insert(leadActivities).values({
    leadId: id,
    type: won ? "status_change" : "stage_change",
    body: won ? "Moved to Won — marked as won." : `Moved to ${stageLabel(stage)}.`,
  });

  revalidateLead(id);
}

export async function markLeadWon(id: string) {
  const db = getDb();
  await db
    .update(leads)
    .set({ stage: "won", status: "won", closedAt: new Date(), updatedAt: new Date() })
    .where(eq(leads.id, id));

  await db.insert(leadActivities).values({
    leadId: id,
    type: "status_change",
    body: "Marked as won.",
  });

  revalidateLead(id);
}

export async function markLeadLost(id: string, formData: FormData) {
  const reason = String(formData.get("reason") ?? "").trim();
  const db = getDb();
  await db
    .update(leads)
    .set({
      status: "lost",
      lostReason: reason || null,
      closedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id));

  await db.insert(leadActivities).values({
    leadId: id,
    type: "status_change",
    body: reason ? `Marked as lost: ${reason}` : "Marked as lost.",
  });

  revalidateLead(id);
}

export async function rejectLead(id: string) {
  const db = getDb();
  await db
    .update(leads)
    .set({ status: "lost", closedAt: new Date(), updatedAt: new Date() })
    .where(eq(leads.id, id));

  await db.insert(leadActivities).values({
    leadId: id,
    type: "status_change",
    body: "Rejected from pipeline.",
  });

  revalidateLead(id);
}

export async function reopenLead(id: string) {
  const db = getDb();
  await db
    .update(leads)
    .set({ status: "active", closedAt: null, updatedAt: new Date() })
    .where(eq(leads.id, id));

  await db.insert(leadActivities).values({
    leadId: id,
    type: "status_change",
    body: "Reopened.",
  });

  revalidateLead(id);
}

export async function addLeadNote(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const leadId = String(formData.get("leadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!leadId) return { error: "Missing lead id." };
  if (!body) return { error: "Note can't be empty." };

  const db = getDb();
  await db.insert(leadActivities).values({ leadId, type: "note", body });

  revalidatePath(`/leads/${leadId}`);
}
