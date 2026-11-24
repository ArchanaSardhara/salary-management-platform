import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FormAlertProps {
  variant: "error" | "success";
  title: string;
  message?: string | null;
}

/** Form-level status message (API errors, confirmations). Announced to screen readers via role="alert". */
export function FormAlert({ variant, title, message }: FormAlertProps) {
  const Icon = variant === "error" ? CircleAlertIcon : CircleCheckIcon;

  return (
    <Alert variant={variant === "error" ? "destructive" : "default"}>
      <Icon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      {message ? <AlertDescription>{message}</AlertDescription> : null}
    </Alert>
  );
}
