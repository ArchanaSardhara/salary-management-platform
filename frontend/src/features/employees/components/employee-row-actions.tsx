"use client";

import { EllipsisIcon, EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFullName } from "@/lib/format";

import { EMPLOYEE_ROUTES } from "../routes";
import type { Employee } from "../types";

interface EmployeeRowActionsProps {
  employee: Employee;
  onDelete: (employee: Employee) => void;
}

export function EmployeeRowActions({ employee, onDelete }: EmployeeRowActionsProps) {
  const isDeleted = employee.status === "DELETED";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${getFullName(employee)}`}
          />
        }
      >
        <EllipsisIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem render={<Link href={EMPLOYEE_ROUTES.detail(employee.id)} />}>
          <EyeIcon aria-hidden="true" />
          View employee
        </DropdownMenuItem>
        {/* Deleted employees must be restored before they can be edited. */}
        <DropdownMenuItem
          disabled={isDeleted}
          render={isDeleted ? undefined : <Link href={EMPLOYEE_ROUTES.edit(employee.id)} />}
        >
          <PencilIcon aria-hidden="true" />
          Edit employee
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isDeleted}
          onClick={() => onDelete(employee)}
        >
          <Trash2Icon aria-hidden="true" />
          Delete employee
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
