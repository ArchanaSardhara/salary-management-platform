"use client";

import { useState } from "react";

import { BarChart } from "@/components/charts/bar-chart";
import type { BarItem } from "@/components/charts/bar-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/format";

import { CHART_COLORS, PAYROLL_CURRENCIES, formatAmount } from "../display";
import { usePayrollByCountry, usePayrollByDepartment } from "../hooks";
import type { PayrollGroupItem } from "../types";

function toBarItems(rows: PayrollGroupItem[]): BarItem[] {
  return rows.map((row, index) => ({
    label: row.name,
    value: parseFloat(row.total),
    color: CHART_COLORS[index % CHART_COLORS.length],
    meta: { row },
  }));
}

function PayrollTooltip(item: BarItem) {
  const row = item.meta?.row as PayrollGroupItem | undefined;
  if (!row) return null;
  return (
    <div className="px-3 py-2 text-sm space-y-1">
      <p className="font-medium">{row.name}</p>
      <p className="text-muted-foreground">
        Total:{" "}
        <span className="text-foreground font-medium">
          {formatAmount(row.total, row.currency)}
        </span>
      </p>
      <p className="text-muted-foreground">
        Avg:{" "}
        <span className="text-foreground">{formatAmount(row.avg, row.currency)}</span>
      </p>
      <p className="text-muted-foreground">
        Employees: <span className="text-foreground">{formatNumber(row.count)}</span>
      </p>
    </div>
  );
}

type GroupBy = "department" | "country";

export function PayrollChart() {
  const [currency, setCurrency] = useState("USD");
  const [groupBy, setGroupBy] = useState<GroupBy>("department");

  const deptQuery = usePayrollByDepartment(currency);
  const countryQuery = usePayrollByCountry(currency);
  const activeQuery = groupBy === "department" ? deptQuery : countryQuery;

  const barData = activeQuery.data ? toBarItems(activeQuery.data) : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Payroll Breakdown</CardTitle>
            <CardDescription>Total active compensation by group</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <TabsList>
                <TabsTrigger value="department">Department</TabsTrigger>
                <TabsTrigger value="country">Country</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-24" aria-label="Select currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYROLL_CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <BarChart
          data={barData}
          isLoading={activeQuery.isLoading}
          renderTooltip={PayrollTooltip}
          emptyMessage={`No ${currency} payroll data`}
          height={260}
        />
      </CardContent>
    </Card>
  );
}
