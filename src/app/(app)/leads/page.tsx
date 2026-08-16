import Link from "next/link";
import { desc, eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, companies, contacts } from "@/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";
import { LeadFormSheet } from "./lead-form";
import { StageBadge, StatusBadge } from "@/components/stage-badge";
import { formatCurrency } from "@/lib/format";
import { STAGES } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

export default async function LeadsPage({
  searchParams,
}: PageProps<"/leads">) {
  const { companyId, contactId, stage } = await searchParams;
  const stageFilter = typeof stage === "string" ? stage : undefined;
  const prefillCompanyId = typeof companyId === "string" ? companyId : undefined;
  const prefillContactId = typeof contactId === "string" ? contactId : undefined;

  const db = getDb();

  const conditions = [];
  if (stageFilter) conditions.push(eq(leads.stage, stageFilter as (typeof STAGES)[number]["value"]));

  const [rows, allCompanies, allContacts] = await Promise.all([
    db
      .select({
        id: leads.id,
        title: leads.title,
        stage: leads.stage,
        status: leads.status,
        value: leads.value,
        owner: leads.owner,
        companyName: companies.name,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .leftJoin(companies, eq(leads.companyId, companies.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(leads.createdAt)),
    db.select({ id: companies.id, name: companies.name }).from(companies),
    db
      .select({ id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName })
      .from(contacts),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Every opportunity currently in motion.
          </p>
        </div>
        <LeadFormSheet
          companies={allCompanies}
          contacts={allContacts}
          defaultCompanyId={prefillCompanyId}
          defaultContactId={prefillContactId}
          defaultOpen={Boolean(prefillCompanyId || prefillContactId)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href="/leads"
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium",
            !stageFilter
              ? "border-foreground/20 bg-secondary text-secondary-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          All stages
        </Link>
        {STAGES.map((s) => (
          <Link
            key={s.value}
            href={`/leads?stage=${s.value}`}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium",
              stageFilter === s.value
                ? "border-foreground/20 bg-secondary text-secondary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All leads</CardTitle>
          <CardDescription>{rows.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <Users className="size-8" />
              <p className="text-sm">No leads yet. Add your first one to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link href={`/leads/${row.id}`} className="font-medium hover:underline">
                        {row.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.companyName ?? "—"}
                    </TableCell>
                    <TableCell>
                      {row.status === "active" ? (
                        <StageBadge stage={row.stage} />
                      ) : (
                        <StatusBadge status={row.status} />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.owner ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
