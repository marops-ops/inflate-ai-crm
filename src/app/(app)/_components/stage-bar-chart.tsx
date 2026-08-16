"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export function StageBarChart({
  data,
}: {
  data: { stage: string; label: string; count: number; color: string }[];
}) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d) => [d.stage, { label: d.label, color: d.color }])
  );

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
          allowDecimals={false}
          width={28}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="stage" />}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((d) => (
            <Cell key={d.stage} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
