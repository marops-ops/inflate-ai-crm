import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { companies, contacts, leads } from "@/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { CompanyFormSheet } from "../company-form";
import { deleteCompany } from "../actions";
import { StageBadge, StatusBadge } from "@/components/stage-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Globe,
  Phone,
  MapPin,
  Building2,
  ArrowLeft,
  Users,
  KanbanSquare,
} from "lucide-react";

export default async function CompanyDetailPage({
  params,
}: PageProps<"/companies/[id]">) {
  const { id } = await params;
  const db = getDb();

  const [company] = await db.select().from(companies).where(eq(companies.id, id));
  if (!company) notFound();

  const companyContacts = await db
    .select()
    .from(contacts)
    .where(eq(contacts.companyId, id))
    .orderBy(desc(contacts.createdAt));

  const companyLeads = await db
    .select()
    .from(leads)
    .where(eq(leads.companyId, id))
    .orderBy(desc(leads.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/companies"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Companies
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-secondary">
              <Building2 className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
              {company.industry ? (
                <p className="text-sm text-muted-foreground">{company.industry}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CompanyFormSheet company={company} />
            <ConfirmDeleteButton
              action={deleteCompany.bind(null, company.id)}
              itemLabel={company.name}
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
            <DetailRow icon={Globe} label={company.website ?? "—"} href={company.website} />
            <DetailRow icon={Phone} label={company.phone ?? "—"} />
            <DetailRow icon={MapPin} label={company.address ?? "—"} />
            <Separator />
            <p className="text-xs text-muted-foreground">
              Added {formatDate(company.createdAt)}
            </p>
            {company.notes ? (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap text-sm">{company.notes}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" />
                Contacts
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/contacts?companyId=${company.id}`} />}
              >
                Add contact
              </Button>
            </CardHeader>
            <CardContent>
              {companyContacts.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No contacts linked to this company yet.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {companyContacts.map((contact) => (
                    <li key={contact.id} className="flex items-center justify-between py-2.5">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {contact.firstName} {contact.lastName ?? ""}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        {contact.jobTitle ?? contact.email ?? ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

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
                render={<Link href={`/leads?companyId=${company.id}`} />}
              >
                Add lead
              </Button>
            </CardHeader>
            <CardContent>
              {companyLeads.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No leads linked to this company yet.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {companyLeads.map((lead) => (
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string | null;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      {href ? (
        <a
          href={href.startsWith("http") ? href : `https://${href}`}
          target="_blank"
          rel="noreferrer"
          className="truncate hover:underline"
        >
          {label}
        </a>
      ) : (
        <span className="truncate text-foreground">{label}</span>
      )}
    </div>
  );
}
