"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-client";
import { getFullName } from "@/lib/format";

import { useDeleteEmployee } from "../hooks";
import type { Employee } from "../types";

interface DeleteEmployeeDialogProps {
  /** The employee to delete; `null` closes the dialog. */
  employee: Employee | null;
  onClose: () => void;
  onDeleted?: (employee: Employee) => void;
}

export function DeleteEmployeeDialog({ employee, onClose, onDeleted }: DeleteEmployeeDialogProps) {
  const deleteEmployee = useDeleteEmployee();

  const close = () => {
    deleteEmployee.reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!employee) return;
    deleteEmployee.mutate(employee.id, {
      onSuccess: (deleted) => {
        toast.add({
          type: "success",
          title: "Employee deleted",
          description: `${getFullName(deleted)} (${deleted.employeeCode}) was deleted.`,
        });
        close();
        onDeleted?.(deleted);
      },
    });
  };

  return (
    <ConfirmDialog
      open={employee !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title="Delete employee?"
      description={
        employee ? (
          <>
            <strong className="font-medium text-foreground">
              {getFullName(employee)} ({employee.employeeCode})
            </strong>{" "}
            will be removed from the active directory. The record and its
            history are kept and can be restored later.
          </>
        ) : null
      }
      confirmLabel="Delete employee"
      pendingLabel="Deleting…"
      destructive
      isPending={deleteEmployee.isPending}
      errorMessage={deleteEmployee.isError ? getErrorMessage(deleteEmployee.error) : null}
      onConfirm={handleConfirm}
    />
  );
}
