"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalized = email.trim().toLowerCase();
    if (!normalized.endsWith("@itu.edu.pk")) {
      setError("Only @itu.edu.pk emails can sign in.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });
      if (signError) {
        setError("Could not sign in. Check your email and password.");
        setLoading(false);
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-[var(--muted)]">Email</label>
        <input
          className="input-field"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="bscs23057@itu.edu.pk"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-[var(--muted)]">Password</label>
        <input
          className="input-field"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <Linkish />
    </form>
  );
}

function Linkish() {
  return (
    <p className="text-center text-xs text-[var(--muted)]">
      <a href="/forgot-password" className="underline-offset-2 hover:underline">
        Forgot password?
      </a>
    </p>
  );
}
