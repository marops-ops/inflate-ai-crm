import { startOfWeek, subWeeks, format } from "date-fns";
import { getDb } from "@/db";
import { leads } from "@/db/schema";

export const dynamic = "force-dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STAGES } from "@/lib/pipeline";
import { formatCurrency } from "@/lib/format";
import { StageBarChart } from "./_components/stage-bar-chart";
import { LeadsTrendChart } from "./_components/leads-trend-chart";
import {
  Users,
  TrendingUp,
  Trophy,
  XCircle,
  Percent,
  Wallet,
} from "lucide-react";

const WEEKS = 8;

export default async function DashboardPage() {
  const db = getDb();
  const allLeads = await db
    .select({
      id: leads.id,
      stage: leads.stage,
      status: leads.status,
      value: leads.value,
      createdAt: leads.createdAt,
    })
    .from(leads);

  const active = allLeads.filter((l) => l.status === "active");
  const won = allLeads.filter((l) => l.status === "won");
  const lost = allLeads.filter((l) => l.status === "lost");

  const pipelineValue = active.reduce((sum, l) => sum + Number(l.value), 0);
  const wonValue = won.reduce((sum, l) => sum + Number(l.value), 0);
  const winRate =
    won.length + lost.length > 0
      ? Math.round((won.length / (won.length + lost.length)) * 100)
      : 0;

  const stageData = STAGES.map((s) => ({
    stage: s.value,
    label: s.label,
    color: s.color,
    count: active.filter((l) => l.stage === s.value).length,
  }));

  const now = new Date();
  const weekStarts = Array.from({ length: WEEKS }, (_, i) =>
    startOfWeek(subWeeks(now, WEEKS - 1 - i), { weekStartsOn: 1 })
  );
  const trendData = weekStarts.map((weekStart) => ({
    key: weekStart.toISOString(),
    week: format(weekStart, "MMM d"),
    count: 0,
  }));
  for (const lead of allLeads) {
    const bucket = startOfWeek(lead.createdAt, { weekStartsOn: 1 }).toISOString();
    const entry = trendData.find((t) => t.key === bucket);
    if (entry) entry.count += 1;
  }

  const kpis = [
    {
      label: "Total leads",
      value: allLeads.length.toLocaleString(),
      icon: Users,
    },
    {
      label: "Active pipeline value",
      value: formatCurrency(pipelineValue),
      icon: TrendingUp,
    },
    {
      label: "Deals won",
      value: won.length.toLocaleString(),
      sub: formatCurrency(wonValue),
      icon: Trophy,
    },
    {
      label: "Deals lost",
      value: lost.length.toLocaleString(),
      icon: XCircle,
    },
    {
      label: "Win rate",
      value: `${winRate}%`,
      icon: Percent,
    },
    {
      label: "Avg. deal size (won)",
      value: formatCurrency(won.length > 0 ? wonValue / won.length : 0),
      icon: Wallet,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A high-level view of Inflate AI's pipeline and performance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <kpi.icon className="size-3.5" />
                {kpi.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold tracking-tight">{kpi.value}</p>
              {kpi.sub ? (
                <p className="text-xs text-muted-foreground">{kpi.sub}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active leads by stage</CardTitle>
            <CardDescription>Where things stand in the pipeline right now.</CardDescription>
          </CardHeader>
          <CardContent>
            {active.length === 0 ? (
              <EmptyChartState message="No active leads yet." />
            ) : (
              <StageBarChart data={stageData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">New leads per week</CardTitle>
            <CardDescription>Last {WEEKS} weeks.</CardDescription>
          </CardHeader>
          <CardContent>
            {allLeads.length === 0 ? (
              <EmptyChartState message="No leads yet." />
            ) : (
              <LeadsTrendChart data={trendData} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
