"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact } from "@/lib/chart-format";

export interface BarItem {
  label: string;
  value: number;
  color: string;
  /** Pass-through data available inside renderTooltip. */
  meta?: Record<string, unknown>;
}

interface TooltipWrapperProps {
  active?: boolean;
  payload?: Array<{ payload: BarItem }>;
  renderTooltip: (item: BarItem) => ReactNode;
}

function TooltipWrapper({ active, payload, renderTooltip }: TooltipWrapperProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background shadow-sm">
      {renderTooltip(payload[0].payload)}
    </div>
  );
}

export interface BarChartProps {
  data: BarItem[];
  /** Y-axis tick formatter — defaults to compact notation. */
  formatTick?: (value: number) => string;
  /** Tooltip content. Required when data is non-empty. */
  renderTooltip: (item: BarItem) => ReactNode;
  height?: number;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function BarChart({
  data,
  formatTick = formatCompact,
  renderTooltip,
  height = 260,
  isLoading = false,
  emptyMessage = "No data available",
}: BarChartProps) {
  if (isLoading) {
    return <Skeleton style={{ height }} className="w-full" />;
  }

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={48}
        />
        <YAxis
          tickFormatter={formatTick}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          content={<TooltipWrapper renderTooltip={renderTooltip} />}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((item, index) => (
            <Cell key={index} fill={item.color} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
