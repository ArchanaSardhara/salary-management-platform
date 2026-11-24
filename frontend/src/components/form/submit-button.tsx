import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface SubmitButtonProps {
  isPending: boolean;
  pendingLabel: string;
  children: ReactNode;
}

export function SubmitButton({ isPending, pendingLabel, children }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={isPending}
      aria-busy={isPending}
    >
      {isPending ? (
        <>
          <Spinner aria-hidden="true" role="presentation" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
