"use client";

import { FormAlert } from "@/components/form/form-alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api-client";

interface QueryErrorProps {
  title: string;
  error: unknown;
  onRetry?: () => void;
}

/** Error state for a failed query, with an optional retry. */
export function QueryError({ title, error, onRetry }: QueryErrorProps) {
  return (
    <div className="flex flex-col items-start gap-3">
      <FormAlert variant="error" title={title} message={getErrorMessage(error)} />
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
