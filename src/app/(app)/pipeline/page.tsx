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
      status: leads.status,
      value: leads.value,
      owner: leads.owner,
      companyName: companies.name,
    })
    .from(leads)
    .leftJoin(companies, eq(leads.companyId, companies.id))
    .orderBy(asc(leads.createdAt));

  const activeCount = rows.filter((r) => r.status === "active").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          {activeCount} active lead{activeCount === 1 ? "" : "s"} in motion. Drag a card
          between columns — including into Rejected — or use "Move to…".
        </p>
      </div>

      <PipelineBoard leads={rows} />
    </div>
  );
}
