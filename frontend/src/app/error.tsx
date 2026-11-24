"use client";

import { FormAlert } from "@/components/form/form-alert";
import { Button } from "@/components/ui/button";

/**
 * Catches unexpected errors below the root layout, including a failed
 * server-side session check in the dashboard layout. Error details are not
 * shown to the user.
 */
export default function RootError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 p-6">
      <FormAlert
        variant="error"
        title="Something went wrong"
        message="We couldn't load this page. Please try again."
      />
      <Button variant="outline" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
