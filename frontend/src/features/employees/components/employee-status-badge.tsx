import { Badge } from "@/components/ui/badge";

import { EMPLOYEE_STATUS_LABELS } from "../display";
import type { EmployeeStatus } from "../types";

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <Badge variant={status === "ACTIVE" ? "success" : "destructive"}>
      {EMPLOYEE_STATUS_LABELS[status]}
    </Badge>
  );
}
