import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, companies, contacts, leadActivities } from "@/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { LeadFormSheet } from "../lead-form";
import { deleteLead } from "../actions";
import { LeadStageControl } from "./lead-stage-control";
import { LeadStatusActions } from "./lead-status-actions";
import { LeadNoteForm } from "./lead-note-form";
import { ContactFormSheet } from "../../contacts/contact-form";
import { StageBadge, StatusBadge } from "@/components/stage-badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import {
  Building2,
  User,
  ArrowLeft,
  Tag,
  UserCircle,
  History,
  StickyNote,
  ArrowRightLeft,
  PlusCircle,
} from "lucide-react";

const ACTIVITY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  created: PlusCircle,
  note: StickyNote,
  stage_change: ArrowRightLeft,
  status_change: History,
};

export default async function LeadDetailPage({
  params,
}: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const db = getDb();

  const [row] = await db
    .select({ lead: leads, company: companies, contact: contacts })
    .from(leads)
    .leftJoin(companies, eq(leads.companyId, companies.id))
    .leftJoin(contacts, eq(leads.contactId, contacts.id))
    .where(eq(leads.id, id));

  if (!row) notFound();
  const { lead, company, contact } = row;

  const [activities, allCompanies, allContacts] = await Promise.all([
    db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, id))
      .orderBy(desc(leadActivities.createdAt)),
    db.select({ id: companies.id, name: companies.name }).from(companies),
    db
      .select({ id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName })
      .from(contacts),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/leads"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Leads
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              {lead.status === "active" ? (
                <StageBadge stage={lead.stage} />
              ) : (
                <StatusBadge status={lead.status} />
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{lead.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LeadStageControl leadId={lead.id} stage={lead.stage} />
            <LeadStatusActions leadId={lead.id} status={lead.status} />
            <LeadFormSheet lead={lead} companies={allCompanies} contacts={allContacts} />
            <ConfirmDeleteButton
              action={deleteLead.bind(null, lead.id)}
              itemLabel={lead.title}
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
            <div className="flex items-center gap-2.5">
              <Tag className="size-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{formatCurrency(lead.value)}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
              {company ? (
                <Link href={`/companies/${company.id}`} className="truncate hover:underline">
                  {company.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">No company</span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <User className="size-4 shrink-0 text-muted-foreground" />
              {contact ? (
                <Link href={`/contacts/${contact.id}`} className="truncate hover:underline">
                  {contact.firstName} {contact.lastName ?? ""}
                </Link>
              ) : (
                <>
                  <span className="text-muted-foreground">No contact</span>
                  <ContactFormSheet
                    companies={allCompanies}
                    defaultCompanyId={company?.id}
                    leadId={lead.id}
                    triggerLabel="Add to contacts"
                    triggerSize="sm"
                  />
                </>
              )}
            </div>
            {lead.owner ? (
              <div className="flex items-center gap-2.5">
                <UserCircle className="size-4 shrink-0 text-muted-foreground" />
                <span>{lead.owner}</span>
              </div>
            ) : null}
            <Separator />
            {lead.source ? (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Source</span>
                <span>{lead.source}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(lead.createdAt)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Updated</span>
              <span>{formatDate(lead.updatedAt)}</span>
            </div>
            {lead.status === "lost" && lead.lostReason ? (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Lost reason</p>
                  <p className="text-sm">{lead.lostReason}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <LeadNoteForm leadId={lead.id} />
              <Separator />
              {activities.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {activities.map((activity) => {
                    const Icon = ACTIVITY_ICON[activity.type] ?? History;
                    return (
                      <li key={activity.id} className="flex gap-3">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                          <Icon className="size-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm whitespace-pre-wrap">{activity.body}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(activity.createdAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
