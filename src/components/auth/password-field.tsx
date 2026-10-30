"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, inputClass } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function PasswordField({
  name = "password",
  label = "Password",
  hint,
  autoComplete = "current-password",
  minLength = 6,
}: {
  name?: string;
  label?: string;
  hint?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);

  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <input
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          required
          className={cn(inputClass, "pr-10")}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );
}
