"use client";

import { SearchIcon, UsersIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-error";
import { Badge } from "@/components/ui/badge";
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

import { useHrManagers } from "../hooks";

export function HrManagerList() {
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(inputValue.trim()), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  const { data, isPending, isError, error, refetch } = useHrManagers(search);

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
        ) : !data?.length ? (
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
              {data.map((manager) => (
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
        )}
      </div>
    </div>
  );
}
