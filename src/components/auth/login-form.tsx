"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { finalizeLogin } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, Field, inputClass } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalized = email.trim().toLowerCase();
    if (!normalized.endsWith("@itu.edu.pk")) {
      setError("Use your @itu.edu.pk email.");
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
        setError("Incorrect email or password.");
        setLoading(false);
        return;
      }

      const result = await finalizeLogin();
      if (result?.error) {
        await supabase.auth.signOut();
        setError(result.error);
        setLoading(false);
        return;
      }

      // Full navigation so the proxy sees cookies and the browser can offer to save the password.
      window.location.assign("/dashboard");
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" method="post">
      <Field label="Email">
        <input
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@itu.edu.pk"
          className={inputClass}
        />
      </Field>
      <Field label="Password">
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(inputClass, "pr-10")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      {error ? (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className={cn(buttonClass, "w-full")}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <div className="space-y-2 text-center text-sm text-muted">
        <p>
          No password yet?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
        <p>
          <Link href="/forgot-password" className="hover:text-accent hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </form>
  );
}
