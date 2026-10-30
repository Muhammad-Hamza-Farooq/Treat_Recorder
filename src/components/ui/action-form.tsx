"use client";

import { useActionState } from "react";
import { buttonClass } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export type ActionState = { error?: string; success?: string } | null;

type ActionFormProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  children?: React.ReactNode;
  className?: string;
  /** Extra classes for the submit button (e.g. full width). */
  buttonClassName?: string;
};

/** Form bound to a server action; shows the returned error/success message inline. */
export function ActionForm({ action, submitLabel, children, className, buttonClassName }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className={cn("space-y-4", className)}>
      {children}
      {state?.error ? (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="break-words rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-sm">
          {state.success}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={cn(buttonClass, buttonClassName)}>
        {pending ? "Working…" : submitLabel}
      </button>
    </form>
  );
}
