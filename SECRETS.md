# TreatTracker — Where to find every secret

Fill `.env.local` (created from `.env.example`). Never paste secrets into chat, GitHub, or screenshots.

## Quick checklist

| Variable | Where to get it | Public? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Yes (safe in browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` | Yes (safe with RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` | **NO — server only** |
| `RESEND_API_KEY` | [Resend API Keys](https://resend.com/api-keys) | **NO** |
| `RESEND_FROM_EMAIL` | Your verified domain in Resend → Domains | Display only |
| `AXIOM_TOKEN` | [Axiom](https://app.axiom.co) → Settings → API tokens | **NO** |
| `AXIOM_DATASET` | Axiom → Datasets (create `treattracker`) | Name only |
| `NEXT_PUBLIC_APP_URL` | Local: `http://localhost:3000` / Prod: your Vercel URL | Yes |
| `CRON_SECRET` | Generate yourself (see below) | **NO** |
| `LEADER_EMAIL` | Fixed for this group: `bscs23057@nu.edu.pk` (Hamza) | Config |
| `ALLOWED_EMAIL_DOMAIN` | Default `nu.edu.pk` (change if your university domain differs) | Config |

---

## 1. Supabase (database + auth)

Your linked project URL:

`https://djvjczjffxqncuqjdzrs.supabase.co`

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/djvjczjffxqncuqjdzrs/settings/api)
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Reveal and copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
5. Never expose `service_role` to the browser or commit it

Auth setup (Phase 2):

- Authentication → Providers → Email enabled
- Confirm email / password reset URLs must include `NEXT_PUBLIC_APP_URL`

---

## 2. Resend (email invitations + notifications)

1. Sign up / log in at [https://resend.com](https://resend.com)
2. API Keys → **Create API Key** → copy → `RESEND_API_KEY`
3. Domains → add and verify your sending domain (DNS records Resend shows)
4. Set `RESEND_FROM_EMAIL` like: `TreatTracker <noreply@yourdomain.com>`

Until a domain is verified, Resend only allows sending to your own signup email for testing.

---

## 3. Axiom (structured logs)

1. Sign up / log in at [https://app.axiom.co](https://app.axiom.co)
2. Create a dataset named `treattracker` → `AXIOM_DATASET`
3. Settings → API tokens → create a token with ingest permission → `AXIOM_TOKEN`
4. Optional: copy org id if your Axiom setup requires it → `AXIOM_ORG_ID`

---

## 4. App URL + Cron secret

**Local**

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production (Vercel)**

Use your deployment URL, e.g. `https://treattracker.vercel.app`

**CRON_SECRET** — generate a long random string:

PowerShell:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Or OpenSSL:

```bash
openssl rand -base64 48
```

Put the same value in Vercel Environment Variables and protect `/api/cron/*` with `Authorization: Bearer <CRON_SECRET>`.

---

## 5. Allowed emails for this group

Only these student IDs may register (domain from `ALLOWED_EMAIL_DOMAIN`, default `nu.edu.pk`):

| Name | Student ID | Email (default domain) | Role |
|---|---|---|---|
| Hamza | bscs23057 | bscs23057@itu.edu.pk | **LEADER** |
| Adil Baig | bscs23054 | bscs23054@itu.edu.pk | Member |
| Mehar Ali | bscs23087 | bscs23087@itu.edu.pk | Member |
| Moeez Umer | bscs23150 | bscs23150@itu.edu.pk | Member |
| Bilal Chaudhary | bscs23172 | bscs23172@itu.edu.pk | Member |
| Abrar Ahmed | bscs23093 | bscs23093@itu.edu.pk | Member |
| Wahaj Aziz | bscs23107 | bscs23107@itu.edu.pk | Member |
| Emad Sohail | bscs23117 | bscs23117@itu.edu.pk | Member |
| M. Abdullah | bscs23202 | bscs23202@itu.edu.pk | Member |

Domain is set via `ALLOWED_EMAIL_DOMAIN` (currently `itu.edu.pk`).

Registration is invitation-only. Public signup stays closed.

---

## 6. Vercel (production)

Project Settings → Environment Variables — add the same keys as `.env.local` for Production / Preview.

Never enable “Expose to Browser” for:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `AXIOM_TOKEN`
- `CRON_SECRET`

---

## After filling secrets

1. Save `.env.local`
2. Restart `npm run dev`
3. Continue Phase 2 (database + auth) once Supabase keys are present
