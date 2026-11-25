"use client";

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, PlusIcon, ReceiptTextIcon } from "lucide-react";
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

import { useCompensationAuditLog, useCompensationRecords, COMPENSATION_PAGE_SIZE } from "../hooks";
import { EditEndDateDialog } from "./edit-end-date-dialog";
import type { AuditLogEntry, CompensationRecord, CompensationSnapshot } from "../types";
import { AddCompensationDialog } from "./add-compensation-dialog";

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
  const [editOpen, setEditOpen] = useState(false);
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
          <div className="flex items-center justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setEditOpen(true)}
              aria-label="Edit end date"
              title="Edit end date"
            >
              <PencilIcon className="size-3.5" aria-hidden="true" />
            </Button>
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
          </div>
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
      <EditEndDateDialog
        employeeId={employeeId}
        record={record}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

function CompensationPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  disabled?: boolean;
}) {
  if (totalPages <= 1 && total <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {total === 0 ? "No records" : `${start}–${end} of ${total}`}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || disabled}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="flex size-8 items-center justify-center text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "outline" : "ghost"}
                size="icon"
                className="size-8"
                onClick={() => onPageChange(p as number)}
                disabled={disabled}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || disabled}
            aria-label="Next page"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function EmployeeCompensation({ employeeId }: { employeeId: string }) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } =
    useCompensationRecords(employeeId, page);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          <h2>Compensation history</h2>
        </CardTitle>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon aria-hidden="true" />
          Add record
        </Button>
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
            <CompensationPagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              pageSize={COMPENSATION_PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </CardContent>
    </Card>
    <AddCompensationDialog
      employeeId={employeeId}
      open={addOpen}
      onOpenChange={setAddOpen}
      onSuccess={() => setPage(1)}
    />
    </>
  );
}
