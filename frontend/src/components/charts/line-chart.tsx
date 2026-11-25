"use client";

import type { ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";

export interface LineDataPoint {
  label: string;
  [key: string]: string | number;
}

export interface LineSeries {
  key: string;
  name: string;
  color: string;
}

export interface LineChartLegendItem {
  label: string;
  color: string;
}

interface TooltipPoint {
  name: string;
  value: number;
  color: string;
}

interface TooltipWrapperProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ name: string; value: number; color: string }>;
  renderTooltip: (label: string, points: TooltipPoint[]) => ReactNode;
}

function TooltipWrapper({ active, label, payload, renderTooltip }: TooltipWrapperProps) {
  if (!active || !payload?.length || label === undefined) return null;
  return (
    <div className="rounded-lg border bg-background shadow-sm">
      {renderTooltip(label, payload)}
    </div>
  );
}

export interface LineChartProps {
  data: LineDataPoint[];
  series: LineSeries[];
  legend?: LineChartLegendItem[];
  renderTooltip: (label: string, points: TooltipPoint[]) => ReactNode;
  height?: number;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function LineChart({
  data,
  series,
  legend,
  renderTooltip,
  height = 200,
  isLoading = false,
  emptyMessage = "No data available",
}: LineChartProps) {
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
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            content={<TooltipWrapper renderTooltip={renderTooltip} />}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>

      {legend && (
        <div className="flex justify-center gap-6 text-sm" aria-hidden="true">
          {legend.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block h-0.5 w-4 rounded"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
