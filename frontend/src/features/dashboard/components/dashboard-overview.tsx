import { ROLE_LABELS, type SessionUser } from "@/features/auth/types";

import { CompensationTypeChart } from "./compensation-type-chart";
import { HeadcountTrendChart } from "./headcount-trend-chart";
import { NoCompensationTable } from "./no-compensation-table";
import { PayrollChart } from "./payroll-chart";
import { RecentChangesTable } from "./recent-changes-table";
import { StatCards } from "./stat-cards";

interface DashboardOverviewProps {
  user: SessionUser;
}

export function DashboardOverview({ user }: DashboardOverviewProps) {
  return (
    <>
      <section aria-labelledby="dashboard-heading" className="flex flex-col gap-1">
        <h1 id="dashboard-heading" className="text-2xl font-semibold tracking-tight">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {ROLE_LABELS[user.role]}.
        </p>
      </section>

      <StatCards />

      <PayrollChart />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CompensationTypeChart />
        <HeadcountTrendChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentChangesTable />
        <NoCompensationTable />
      </div>
    </>
  );
}
