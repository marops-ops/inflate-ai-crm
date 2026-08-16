import { eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, companies } from "@/db/schema";
import { PipelineBoard } from "./pipeline-board";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const db = getDb();

  const rows = await db
    .select({
      id: leads.id,
      title: leads.title,
      stage: leads.stage,
      value: leads.value,
      owner: leads.owner,
      companyName: companies.name,
    })
    .from(leads)
    .leftJoin(companies, eq(leads.companyId, companies.id))
    .where(eq(leads.status, "active"))
    .orderBy(asc(leads.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} active lead{rows.length === 1 ? "" : "s"} in motion. Drag a card
          between columns, or use "Move to…".
        </p>
      </div>

      <PipelineBoard leads={rows} />
    </div>
  );
}
