"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";

import { LineChart } from "@/components/charts/line-chart";
import type {
  LineDataPoint,
  LineSeries,
  LineChartLegendItem,
} from "@/components/charts/line-chart";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatNumber } from "@/lib/format";

import { CHART_COLORS, daysAgo, formatPeriodLabel, todayISO } from "../display";
import { useHeadcountTrend } from "../hooks";
import type { HeadcountPeriodItem, HeadcountTrend } from "../types";
import { cn } from "cn";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERIES: LineSeries[] = [
  { key: "active", name: "Active", color: CHART_COLORS[0] },
  { key: "newHires", name: "New Hires", color: CHART_COLORS[1] },
];

const LEGEND: LineChartLegendItem[] = SERIES.map((s) => ({
  label: s.name,
  color: s.color,
}));

type PeriodPreset = "7d" | "1m" | "6m" | "1y" | "custom";

const PRESETS: { value: PeriodPreset; label: string; days: number }[] = [
  { value: "7d", label: "7D", days: 7 },
  { value: "1m", label: "1M", days: 30 },
  { value: "6m", label: "6M", days: 183 },
  { value: "1y", label: "1Y", days: 365 },
];

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

function toDataPoints(trend: HeadcountTrend): LineDataPoint[] {
  return trend.periods.map((p: HeadcountPeriodItem) => ({
    label: formatPeriodLabel(p.period, trend.granularity),
    active: p.active,
    newHires: p.newHires,
  }));
}

function TrendTooltip(
  label: string,
  points: Array<{ name: string; value: number; color: string }>,
) {
  return (
    <div className="px-3 py-2 text-sm space-y-1">
      <p className="font-medium">{label}</p>
      {points.map((p) => (
        <p
          key={p.name}
          className="flex items-center gap-1.5 text-muted-foreground"
        >
          <span
            className="inline-block size-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: p.color }}
            aria-hidden="true"
          />
          {p.name}:
          <span className="text-foreground font-medium">
            {formatNumber(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Period controls
// ---------------------------------------------------------------------------

interface PeriodControlsProps {
  preset: PeriodPreset;
  customStart: string;
  customEnd: string;
  onPresetChange: (p: PeriodPreset) => void;
  onCustomChange: (start: string, end: string) => void;
}

function PeriodControls({
  preset,
  customStart,
  customEnd,
  onPresetChange,
  onCustomChange,
}: PeriodControlsProps) {
  const [localStart, setLocalStart] = useState(customStart);
  const [localEnd, setLocalEnd] = useState(customEnd);

  function applyCustom() {
    onCustomChange(localStart, localEnd);
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {PRESETS.map((p) => (
        <Button
          key={p.value}
          variant={preset === p.value ? "default" : "outline"}
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => onPresetChange(p.value)}
        >
          {p.label}
        </Button>
      ))}
      <Popover>
        <PopoverTrigger
          className={cn(
            buttonVariants({
              variant: preset === "custom" ? "default" : "outline",
              size: "sm",
            }),
            "h-7 px-2.5 text-xs gap-1",
          )}
        >
          <CalendarIcon className="size-3" aria-hidden="true" />
          Custom
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="trend-start" className="text-xs">
                From
              </Label>
              <Input
                id="trend-start"
                type="date"
                className="h-8 text-sm"
                value={localStart}
                max={localEnd || todayISO()}
                onChange={(e) => setLocalStart(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="trend-end" className="text-xs">
                To
              </Label>
              <Input
                id="trend-end"
                type="date"
                className="h-8 text-sm"
                value={localEnd}
                min={localStart}
                max={todayISO()}
                onChange={(e) => setLocalEnd(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={applyCustom}
              disabled={!localStart || !localEnd}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function HeadcountTrendChart() {
  const [preset, setPreset] = useState<PeriodPreset>("1y");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState(todayISO);

  const { startDate, endDate } = (() => {
    if (preset === "custom") {
      return {
        startDate: customStart || undefined,
        endDate: customEnd || undefined,
      };
    }
    const days = PRESETS.find((p) => p.value === preset)!.days;
    return { startDate: daysAgo(days), endDate: todayISO() };
  })();

  const { data, isLoading } = useHeadcountTrend(startDate, endDate);
  const chartData = data ? toDataPoints(data) : [];

  function handlePresetChange(p: PeriodPreset) {
    setPreset(p);
  }

  function handleCustomChange(start: string, end: string) {
    setCustomStart(start);
    setCustomEnd(end);
    setPreset("custom");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Headcount Trend</CardTitle>
            <CardDescription>
              Active employees and new hires over time
            </CardDescription>
          </div>
          <PeriodControls
            preset={preset}
            customStart={customStart}
            customEnd={customEnd}
            onPresetChange={handlePresetChange}
            onCustomChange={handleCustomChange}
          />
        </div>
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
