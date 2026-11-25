"use client";

import { AlertCircleIcon, TrendingUpIcon, UsersIcon, FileTextIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { useDashboardStats } from "../hooks";

interface StatCardProps {
  title: string;
  value: number | undefined;
  isLoading: boolean;
  icon: React.ReactNode;
  description: string;
  variant?: "default" | "warning";
}

function StatCard({ title, value, isLoading, icon, description, variant = "default" }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span
          className={
            variant === "warning"
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
          }
          aria-hidden="true"
        >
          {icon}
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-3xl font-bold tracking-tight">
            {value !== undefined ? formatNumber(value) : "—"}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export function StatCards() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        title="Active Employees"
        value={data?.activeEmployees}
        isLoading={isLoading}
        icon={<UsersIcon className="size-4" />}
        description="Total headcount"
      />
      <StatCard
        title="New Hires"
        value={data?.newHiresThisMonth}
        isLoading={isLoading}
        icon={<TrendingUpIcon className="size-4" />}
        description="Joined this month"
      />
      <StatCard
        title="Comp Records"
        value={data?.compensationRecordsThisMonth}
        isLoading={isLoading}
        icon={<FileTextIcon className="size-4" />}
        description="Created this month"
      />
      <StatCard
        title="No Compensation"
        value={data?.employeesWithoutCompensation}
        isLoading={isLoading}
        icon={<AlertCircleIcon className="size-4" />}
        description="Active employees without an open record"
        variant={
          data?.employeesWithoutCompensation && data.employeesWithoutCompensation > 0
            ? "warning"
            : "default"
        }
      />
    </div>
  );
}
