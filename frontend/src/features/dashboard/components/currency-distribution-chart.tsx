"use client";

import { DonutChart } from "@/components/charts/donut-chart";
import type { DonutSlice, LegendItem } from "@/components/charts/donut-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

import { CHART_COLORS } from "../display";
import { usePayrollByCurrency } from "../hooks";
import type { PayrollCurrencyItem } from "../types";

function toSlices(items: PayrollCurrencyItem[]): DonutSlice[] {
  return items.map((item, index) => ({
    label: item.currency,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function toLegend(items: PayrollCurrencyItem[], total: number): LegendItem[] {
  return items.map((item, index) => ({
    label: item.currency,
    color: CHART_COLORS[index % CHART_COLORS.length],
    annotation: `${total > 0 ? Math.round((item.count / total) * 100) : 0}%`,
  }));
}

function CurrencyTooltip(slice: DonutSlice) {
  return (
    <div className="px-3 py-2 text-sm space-y-0.5">
      <p className="font-medium">{slice.label}</p>
      <p className="text-muted-foreground">
        Employees: <span className="text-foreground">{formatNumber(slice.value)}</span>
      </p>
    </div>
  );
}

export function CurrencyDistributionChart() {
  const { data, isLoading } = usePayrollByCurrency();

  const total = data?.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const slices = data ? toSlices(data) : [];
  const legend = data ? toLegend(data, total) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salary by Currency</CardTitle>
        <CardDescription>Active employees by compensation currency</CardDescription>
      </CardHeader>
      <CardContent>
        <DonutChart
          data={slices}
          legend={legend}
          renderTooltip={CurrencyTooltip}
          isLoading={isLoading}
          emptyMessage="No active compensation records"
          height={200}
        />
      </CardContent>
    </Card>
  );
}
