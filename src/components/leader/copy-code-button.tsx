"use client";

import { useState } from "react";
import { ghostButtonClass } from "@/components/ui/primitives";

export function CopyCodeButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={onCopy} className={ghostButtonClass}>
      {copied ? "Copied" : label}
    </button>
  );
}
