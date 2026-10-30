"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { name: string; email: string; role: string };

export function InviteForm({ options }: { options: Option[] }) {
  const router = useRouter();
  const [email, setEmail] = useState(options[0]?.email ?? "");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/leader/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, notes }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Invite failed");
      setLoading(false);
      return;
    }
    setResult(data.acceptUrl ? `Invite link: ${data.acceptUrl}` : "Invite sent.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">
        Send an <span className="font-display italic font-normal">invite</span>
      </h2>
      <div>
        <label className="mb-1.5 block text-sm text-[var(--muted)]">Friend</label>
        <select className="input-field" value={email} onChange={(e) => setEmail(e.target.value)}>
          {options.map((o) => (
            <option key={o.email} value={o.email}>
              {o.name} · {o.email}
              {o.role === "leader" ? " (leader)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-[var(--muted)]">Notes (optional)</label>
        <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {result ? <p className="break-all text-xs text-[var(--muted)]">{result}</p> : null}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Sending…" : "Create invite"}
      </button>
    </form>
  );
}
