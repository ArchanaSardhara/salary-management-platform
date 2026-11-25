"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Skeleton } from "@/components/ui/skeleton";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface TooltipWrapperProps {
  active?: boolean;
  payload?: Array<{ payload: DonutSlice }>;
  renderTooltip: (slice: DonutSlice) => ReactNode;
}

function TooltipWrapper({ active, payload, renderTooltip }: TooltipWrapperProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background shadow-sm">
      {renderTooltip(payload[0].payload)}
    </div>
  );
}

export interface LegendItem {
  label: string;
  color: string;
  annotation?: string;
}

export interface DonutChartProps {
  data: DonutSlice[];
  legend?: LegendItem[];
  renderTooltip: (slice: DonutSlice) => ReactNode;
  height?: number;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DonutChart({
  data,
  legend,
  renderTooltip,
  height = 200,
  isLoading = false,
  emptyMessage = "No data available",
}: DonutChartProps) {
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
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={2}
          >
            {data.map((slice, index) => (
              <Cell
                key={index}
                fill={slice.color}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<TooltipWrapper renderTooltip={renderTooltip} />} />
        </PieChart>
      </ResponsiveContainer>

      {legend && (
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-sm">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{item.label}</span>
              {item.annotation && (
                <span className="font-medium">{item.annotation}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
