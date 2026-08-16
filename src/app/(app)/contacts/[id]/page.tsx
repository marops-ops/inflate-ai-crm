import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { contacts, companies, leads } from "@/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ContactFormSheet } from "../contact-form";
import { deleteContact } from "../actions";
import { StageBadge, StatusBadge } from "@/components/stage-badge";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import {
  Mail,
  Phone,
  Building2,
  ArrowLeft,
  KanbanSquare,
} from "lucide-react";

export default async function ContactDetailPage({
  params,
}: PageProps<"/contacts/[id]">) {
  const { id } = await params;
  const db = getDb();

  const [row] = await db
    .select({ contact: contacts, company: companies })
    .from(contacts)
    .leftJoin(companies, eq(contacts.companyId, companies.id))
    .where(eq(contacts.id, id));

  if (!row) notFound();
  const { contact, company } = row;

  const [contactLeads, allCompanies] = await Promise.all([
    db.select().from(leads).where(eq(leads.contactId, id)).orderBy(desc(leads.createdAt)),
    db.select({ id: companies.id, name: companies.name }).from(companies),
  ]);

  const fullName = `${contact.firstName} ${contact.lastName ?? ""}`.trim();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/contacts"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Contacts
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback>{initials(fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
              <p className="text-sm text-muted-foreground">
                {contact.jobTitle ?? "—"}
                {company ? (
                  <>
                    {" "}
                    at{" "}
                    <Link href={`/companies/${company.id}`} className="hover:underline">
                      {company.name}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ContactFormSheet contact={contact} companies={allCompanies} />
            <ConfirmDeleteButton
              action={deleteContact.bind(null, contact.id)}
              itemLabel={fullName}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <DetailRow icon={Mail} label={contact.email ?? "—"} href={contact.email ? `mailto:${contact.email}` : undefined} />
            <DetailRow icon={Phone} label={contact.phone ?? "—"} />
            <DetailRow
              icon={Building2}
              label={company?.name ?? "—"}
              href={company ? `/companies/${company.id}` : undefined}
              internal
            />
            <Separator />
            <p className="text-xs text-muted-foreground">Added {formatDate(contact.createdAt)}</p>
            {contact.notes ? (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap text-sm">{contact.notes}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <KanbanSquare className="size-4" />
                Leads
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/leads?contactId=${contact.id}`} />}
              >
                Add lead
              </Button>
            </CardHeader>
            <CardContent>
              {contactLeads.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No leads linked to this contact yet.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {contactLeads.map((lead) => (
                    <li key={lead.id} className="flex items-center justify-between gap-3 py-2.5">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {lead.title}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(lead.value)}
                        </span>
                        {lead.status === "active" ? (
                          <StageBadge stage={lead.stage} />
                        ) : (
                          <StatusBadge status={lead.status} />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  href,
  internal,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  internal?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      {href ? (
        internal ? (
          <Link href={href} className="truncate hover:underline">
            {label}
          </Link>
        ) : (
          <a href={href} className="truncate hover:underline">
            {label}
          </a>
        )
      ) : (
        <span className="truncate text-foreground">{label}</span>
      )}
    </div>
  );
}
