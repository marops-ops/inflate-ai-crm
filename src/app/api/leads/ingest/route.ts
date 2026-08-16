import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { ilike } from "drizzle-orm";
import { getDb } from "@/db";
import { companies, contacts, leads, leadActivities } from "@/db/schema";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
};

function isValidKey(provided: string | null) {
  const expected = process.env.LEAD_INGEST_TOKEN;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function pick(body: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const providedKey =
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null;

  if (!isValidKey(providedKey)) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  const body: Record<string, unknown> = {};
  try {
    if (contentType.includes("application/json")) {
      Object.assign(body, await request.json());
    } else {
      const form = await request.formData();
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") body[key] = value;
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Could not parse request body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Honeypot: bots tend to fill every field, including ones hidden from real users.
  if (pick(body, ["_honeypot", "website_url"])) {
    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  }

  const fullName = pick(body, ["name", "full_name", "fullName"]);
  const nameParts = fullName?.split(/\s+/) ?? [];
  const firstName = pick(body, ["firstName", "first_name", "firstname"]) ?? nameParts[0] ?? null;
  const lastName =
    pick(body, ["lastName", "last_name", "lastname"]) ??
    (nameParts.length > 1 ? nameParts.slice(1).join(" ") : null);

  const email = pick(body, ["email", "email_address"]);
  const phone = pick(body, ["phone", "phone_number", "telephone"]);
  const companyName = pick(body, ["company", "company_name", "organization"]);
  const message = pick(body, ["message", "notes", "comments", "inquiry"]);
  const source = pick(body, ["source"]) ?? "Website";
  const titleOverride = pick(body, ["subject", "title"]);

  if (!firstName && !email && !phone) {
    return NextResponse.json(
      { error: "At least a name, email, or phone number is required." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const db = getDb();

  let companyId: string | null = null;
  if (companyName) {
    const [existingCompany] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(ilike(companies.name, companyName))
      .limit(1);
    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const [createdCompany] = await db
        .insert(companies)
        .values({ name: companyName })
        .returning({ id: companies.id });
      companyId = createdCompany.id;
    }
  }

  let contactId: string | null = null;
  if (email) {
    const [existingContact] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(ilike(contacts.email, email))
      .limit(1);
    if (existingContact) contactId = existingContact.id;
  }
  if (!contactId) {
    const [createdContact] = await db
      .insert(contacts)
      .values({
        firstName: firstName ?? email ?? phone ?? "Unknown",
        lastName,
        email,
        phone,
        companyId,
      })
      .returning({ id: contacts.id });
    contactId = createdContact.id;
  }

  const leadTitle = titleOverride ?? `Website inquiry — ${firstName ?? email ?? phone}`;

  const [lead] = await db
    .insert(leads)
    .values({
      title: leadTitle,
      contactId,
      companyId,
      stage: "new",
      source,
    })
    .returning({ id: leads.id });

  await db.insert(leadActivities).values({
    leadId: lead.id,
    type: "created",
    body: message ? `Submitted via ${source}: "${message}"` : `Submitted via ${source}.`,
  });

  return NextResponse.json(
    { success: true, leadId: lead.id, contactId },
    { headers: CORS_HEADERS }
  );
}
