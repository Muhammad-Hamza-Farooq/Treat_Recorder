# Domain & email setup

## Resend (email)

**Connected now (works immediately):**

```env
RESEND_FROM_EMAIL=TreatTracker <onboarding@resend.dev>
```

This is Resend’s shared test sender. A test email to `bscs23057@itu.edu.pk` already succeeded via API.

### Your own domain (production)

You generally **cannot** verify `itu.edu.pk` (university owns DNS). Use a personal domain (e.g. `treattracker.app`):

1. Resend → Domains → Add domain  
2. Add the DNS records Resend shows (SPF, DKIM, etc.) at your registrar  
3. Click Verify in Resend  
4. Set:

```env
RESEND_FROM_EMAIL=TreatTracker <noreply@yourdomain.com>
```

5. Mirror the same env on Vercel  

## App URL (after Vercel deploy)

```env
NEXT_PUBLIC_APP_URL=https://YOUR-PROJECT.vercel.app
```

Also add that URL in Supabase → Authentication → URL configuration:

- Site URL = production URL  
- Redirect URLs include `https://YOUR-PROJECT.vercel.app/**` and `http://localhost:3000/**`

## Axiom

Dataset `treattracker` exists. App ingest needs an API token from Axiom Console → Settings → API tokens (ingest). Put it in `AXIOM_TOKEN`. Audit still saves to PostgreSQL without it.
