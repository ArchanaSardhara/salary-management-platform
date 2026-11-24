import { ChartColumnIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABELS, type SessionUser } from "@/features/auth/types";

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

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Organization overview</h2>
          </CardTitle>
          <CardDescription>
            Employee counts and compensation statistics by country, department
            and currency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
            <ChartColumnIcon aria-hidden="true" className="size-8 text-muted-foreground" />
            <p className="font-medium">No statistics to show yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Statistics will appear here once the reporting API is available.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
