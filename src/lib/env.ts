import { z } from "zod";

/**
 * Server-side env validation.
 * Public (NEXT_PUBLIC_*) vars are also listed for completeness.
 * Call `getServerEnv()` only from server code.
 */

const serverEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  ALLOWED_EMAIL_DOMAIN: z.string().min(1).default("itu.edu.pk"),
  LEADER_EMAIL: z.string().email().optional(),
  CRON_SECRET: z.string().min(16).optional(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),

  AXIOM_TOKEN: z.string().min(1).optional(),
  AXIOM_DATASET: z.string().min(1).optional(),
  AXIOM_ORG_ID: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration. Check .env.local and SECRETS.md.");
  }
  return parsed.data;
}

export function supabaseConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith("REPLACE_")
  );
}

export function integrationStatus() {
  const env = getServerEnv();
  const isSet = (v?: string) => Boolean(v && !v.startsWith("REPLACE_"));

  return {
    supabaseUrl: isSet(env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnon: isSet(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRole: isSet(env.SUPABASE_SERVICE_ROLE_KEY),
    resend: isSet(env.RESEND_API_KEY) && isSet(env.RESEND_FROM_EMAIL),
    axiom: isSet(env.AXIOM_TOKEN) && isSet(env.AXIOM_DATASET),
    cronSecret: isSet(env.CRON_SECRET),
  };
}
