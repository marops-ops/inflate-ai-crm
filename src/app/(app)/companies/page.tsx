import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { companies, contacts, leads } from "@/db/schema";
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
import { Building2 } from "lucide-react";
import { CompanyFormSheet } from "./company-form";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: companies.id,
      name: companies.name,
      industry: companies.industry,
      website: companies.website,
      createdAt: companies.createdAt,
      contactCount: sql<number>`count(distinct ${contacts.id})`,
      leadCount: sql<number>`count(distinct ${leads.id})`,
    })
    .from(companies)
    .leftJoin(contacts, sql`${contacts.companyId} = ${companies.id}`)
    .leftJoin(leads, sql`${leads.companyId} = ${companies.id}`)
    .groupBy(companies.id)
    .orderBy(desc(companies.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Every organization you're building a relationship with.
          </p>
        </div>
        <CompanyFormSheet />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All companies</CardTitle>
          <CardDescription>{rows.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <Building2 className="size-8" />
              <p className="text-sm">No companies yet. Add your first one to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead className="text-right">Contacts</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/companies/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.industry ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">{row.contactCount}</TableCell>
                    <TableCell className="text-right">{row.leadCount}</TableCell>
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
