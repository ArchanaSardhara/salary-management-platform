"use client";

import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, UsersIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";

import { HR_MANAGER_PAGE_SIZE, useHrManagers } from "../hooks";

export function HrManagerList() {
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(inputValue.trim());
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  const { data, isPending, isError, error, refetch } = useHrManagers(search, page);

  const totalPages = data?.meta.totalPages ?? 1;
  const total = data?.meta.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="HR Managers"
        description="View all HR Manager accounts. Contact your system administrator to add or remove accounts."
      />

      <div className="flex flex-col gap-4">
        <div className="relative max-w-sm">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search by name or email…"
            className="pl-9"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            aria-label="Search HR Managers"
          />
        </div>

        {isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <QueryError
            title="Unable to load HR Managers"
            error={error}
            onRetry={() => void refetch()}
          />
        ) : !data?.data.length ? (
          <EmptyState
            icon={UsersIcon}
            title={search ? "No HR Managers match your search" : "No HR Managers found"}
            description={
              search
                ? "Try a different name or email address."
                : "No HR Manager accounts have been created yet."
            }
          />
        ) : (
          <>
            <Table>
              <TableCaption className="sr-only">HR Manager list</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Name</TableHead>
                  <TableHead scope="col">Email</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((manager) => (
                  <TableRow key={manager.id}>
                    <TableCell className="font-medium">
                      {[manager.firstName, manager.lastName].filter(Boolean).join(" ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {manager.email}
                    </TableCell>
                    <TableCell>
                      {manager.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(manager.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <HrManagerPagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={HR_MANAGER_PAGE_SIZE}
              onPageChange={setPage}
              disabled={isPending}
            />
          </>
        )}
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  ) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

function HrManagerPagination({
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
        {total === 0 ? "No managers" : `${start}–${end} of ${total}`}
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
              <span
                key={`ellipsis-${i}`}
                className="flex size-8 items-center justify-center text-sm text-muted-foreground"
              >
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
