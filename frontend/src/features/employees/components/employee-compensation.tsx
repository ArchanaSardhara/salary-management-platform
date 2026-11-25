"use client";

import { ChevronDownIcon, ChevronRightIcon, ReceiptTextIcon } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { QueryError } from "@/components/query-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "cn";

import { useCompensationAuditLog, useCompensationRecords } from "../hooks";
import type { AuditLogEntry, CompensationRecord, CompensationSnapshot } from "../types";

// ---------------------------------------------------------------------------
// Display maps
// ---------------------------------------------------------------------------

const PAY_FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: "Monthly",
  SEMI_MONTHLY: "Semi-monthly",
  BI_WEEKLY: "Bi-weekly",
  WEEKLY: "Weekly",
  ANNUAL: "Annual",
};

const COMP_TYPE_LABELS: Record<string, string> = {
  BASE_SALARY: "Base salary",
  BONUS: "Bonus",
  COMMISSION: "Commission",
  EQUITY_GRANT: "Equity grant",
  ALLOWANCE: "Allowance",
};

const COMP_TYPE_COLORS: Record<string, string> = {
  BASE_SALARY:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  BONUS:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  COMMISSION:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  EQUITY_GRANT:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  ALLOWANCE: "bg-muted text-muted-foreground",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(amount: string, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${amount} ${currencyCode}`;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CompTypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        COMP_TYPE_COLORS[type] ?? "bg-muted text-muted-foreground",
      )}
    >
      {COMP_TYPE_LABELS[type] ?? type}
    </span>
  );
}

function SnapshotCard({
  snapshot,
  heading,
}: {
  snapshot: CompensationSnapshot;
  heading: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {heading}
      </p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Amount</dt>
          <dd className="font-medium tabular-nums">
            {formatAmount(snapshot.amount, snapshot.currencyCode)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Type</dt>
          <dd>
            <CompTypeBadge type={snapshot.type} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Frequency</dt>
          <dd>{PAY_FREQUENCY_LABELS[snapshot.payFrequency] ?? snapshot.payFrequency}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Effective</dt>
          <dd>
            {formatDate(snapshot.effectiveFrom)}
            <span className="mx-1 text-muted-foreground">→</span>
            {snapshot.effectiveTo ? formatDate(snapshot.effectiveTo) : "Ongoing"}
          </dd>
        </div>
        {snapshot.changeReason ? (
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Reason</dt>
            <dd>{snapshot.changeReason}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function AuditLogPanel({
  employeeId,
  recordId,
}: {
  employeeId: string;
  recordId: string;
}) {
  const { data, isPending, isError } = useCompensationAuditLog(employeeId, recordId);

  if (isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <p className="text-sm text-muted-foreground">Could not load audit log.</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Recorded {formatDateTime(String(data.changedAt))}
        {data.changedById
          ? ` · by ${data.changedById.slice(0, 8)}…`
          : " · by system"}
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {data.beforeValue ? (
          <SnapshotCard snapshot={data.beforeValue} heading="Before" />
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Before
            </p>
            <p className="text-sm text-muted-foreground">
              Initial record — no previous compensation.
            </p>
          </div>
        )}
        <SnapshotCard snapshot={data.afterValue} heading="After" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

const TABLE_COL_COUNT = 6;

function CompensationRow({
  record,
  employeeId,
}: {
  record: CompensationRecord;
  employeeId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isActive = record.effectiveTo === null;

  return (
    <>
      <TableRow className={cn(expanded && "bg-muted/30 hover:bg-muted/30")}>
        <TableCell>
          <CompTypeBadge type={record.type} />
        </TableCell>
        <TableCell className="font-medium tabular-nums">
          {formatAmount(record.amount, record.currencyCode)}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {PAY_FREQUENCY_LABELS[record.payFrequency] ?? record.payFrequency}
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {formatDate(record.effectiveFrom)}
          <span className="mx-1.5 text-muted-foreground">→</span>
          {isActive ? (
            <span className="font-medium text-green-600 dark:text-green-400">
              Ongoing
            </span>
          ) : (
            formatDate(record.effectiveTo)
          )}
        </TableCell>
        <TableCell
          className="max-w-[180px] truncate text-muted-foreground"
          title={record.changeReason ?? undefined}
        >
          {record.changeReason ?? "—"}
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                <ChevronDownIcon className="size-3.5" aria-hidden="true" />
                Hide
              </>
            ) : (
              <>
                <ChevronRightIcon className="size-3.5" aria-hidden="true" />
                Changes
              </>
            )}
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell
            colSpan={TABLE_COL_COUNT}
            className="bg-muted/20 px-6 py-4"
          >
            <AuditLogPanel employeeId={employeeId} recordId={record.id} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function EmployeeCompensation({ employeeId }: { employeeId: string }) {
  const { data, isPending, isError, error, refetch } =
    useCompensationRecords(employeeId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Compensation history</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isPending ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6">
            <QueryError
              title="Unable to load compensation records"
              error={error}
              onRetry={() => void refetch()}
            />
          </div>
        ) : !data?.data.length ? (
          <EmptyState
            icon={ReceiptTextIcon}
            title="No compensation records"
            description="No compensation records have been added for this employee yet."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Effective period</TableHead>
                  <TableHead>Change reason</TableHead>
                  <TableHead className="text-right">Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((record) => (
                  <CompensationRow
                    key={record.id}
                    record={record}
                    employeeId={employeeId}
                  />
                ))}
              </TableBody>
            </Table>
            {data.meta.total > data.meta.pageSize && (
              <p className="border-t p-4 text-center text-sm text-muted-foreground">
                Showing {data.data.length} of {data.meta.total} records.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
