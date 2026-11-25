"use client";

import { DonutChart } from "@/components/charts/donut-chart";
import type { DonutSlice, LegendItem } from "@/components/charts/donut-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

import { CHART_COLORS, COMPENSATION_TYPE_LABELS } from "../display";
import { useCompensationTypeBreakdown } from "../hooks";
import type { CompensationTypeItem } from "../types";

function toSlices(breakdown: CompensationTypeItem[]): DonutSlice[] {
  return breakdown.map((item, index) => ({
    label: COMPENSATION_TYPE_LABELS[item.type] ?? item.type,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function toLegend(breakdown: CompensationTypeItem[], total: number): LegendItem[] {
  return breakdown.map((item, index) => ({
    label: COMPENSATION_TYPE_LABELS[item.type] ?? item.type,
    color: CHART_COLORS[index % CHART_COLORS.length],
    annotation: `${total > 0 ? Math.round((item.count / total) * 100) : 0}%`,
  }));
}

function TypeTooltip(slice: DonutSlice) {
  return (
    <div className="px-3 py-2 text-sm space-y-0.5">
      <p className="font-medium">{slice.label}</p>
      <p className="text-muted-foreground">
        Records: <span className="text-foreground">{formatNumber(slice.value)}</span>
      </p>
    </div>
  );
}

export function CompensationTypeChart() {
  const { data, isLoading } = useCompensationTypeBreakdown();

  const slices = data ? toSlices(data.breakdown) : [];
  const legend = data ? toLegend(data.breakdown, data.total) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compensation Types</CardTitle>
        <CardDescription>Active records by type</CardDescription>
      </CardHeader>
      <CardContent>
        <DonutChart
          data={slices}
          legend={legend}
          renderTooltip={TypeTooltip}
          isLoading={isLoading}
          emptyMessage="No active compensation records"
          height={200}
        />
      </CardContent>
    </Card>
  );
}
