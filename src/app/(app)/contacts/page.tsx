import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { contacts, companies } from "@/db/schema";
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
import { Contact as ContactIcon } from "lucide-react";
import { ContactFormSheet } from "./contact-form";

export default async function ContactsPage({
  searchParams,
}: PageProps<"/contacts">) {
  const { companyId } = await searchParams;
  const db = getDb();

  const [rows, allCompanies] = await Promise.all([
    db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        jobTitle: contacts.jobTitle,
        companyName: companies.name,
        createdAt: contacts.createdAt,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .orderBy(desc(contacts.createdAt)),
    db.select({ id: companies.id, name: companies.name }).from(companies),
  ]);

  const prefillCompanyId = typeof companyId === "string" ? companyId : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Every person you're in touch with.
          </p>
        </div>
        <ContactFormSheet
          companies={allCompanies}
          defaultCompanyId={prefillCompanyId}
          defaultOpen={Boolean(prefillCompanyId)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All contacts</CardTitle>
          <CardDescription>{rows.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <ContactIcon className="size-8" />
              <p className="text-sm">No contacts yet. Add your first one to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/contacts/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.firstName} {row.lastName ?? ""}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.companyName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.jobTitle ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.phone ?? "—"}
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
