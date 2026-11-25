"use client";

import { LineChart } from "@/components/charts/line-chart";
import type { LineDataPoint, LineSeries, LineChartLegendItem } from "@/components/charts/line-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

import { CHART_COLORS, formatShortMonth } from "../display";
import { useHeadcountTrend } from "../hooks";
import type { HeadcountMonthItem } from "../types";

const SERIES: LineSeries[] = [
  { key: "active",   name: "Active",    color: CHART_COLORS[0] },
  { key: "newHires", name: "New Hires", color: CHART_COLORS[1] },
];

const LEGEND: LineChartLegendItem[] = SERIES.map((s) => ({
  label: s.name,
  color: s.color,
}));

function toDataPoints(months: HeadcountMonthItem[]): LineDataPoint[] {
  return months.map((m) => ({
    label: formatShortMonth(m.month),
    active: m.active,
    newHires: m.newHires,
  }));
}

function TrendTooltip(label: string, points: Array<{ name: string; value: number; color: string }>) {
  return (
    <div className="px-3 py-2 text-sm space-y-1">
      <p className="font-medium">{label}</p>
      {points.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="inline-block size-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: p.color }}
            aria-hidden="true"
          />
          {p.name}:
          <span className="text-foreground font-medium">{formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function HeadcountTrendChart() {
  const { data, isLoading } = useHeadcountTrend();
  const chartData = data ? toDataPoints(data.months) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Headcount Trend</CardTitle>
        <CardDescription>Active employees and new hires over the last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        <LineChart
          data={chartData}
          series={SERIES}
          legend={LEGEND}
          renderTooltip={TrendTooltip}
          isLoading={isLoading}
          emptyMessage="No trend data available"
          height={200}
        />
      </CardContent>
    </Card>
  );
}
