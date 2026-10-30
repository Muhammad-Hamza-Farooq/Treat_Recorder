# TreatTracker

Private social accountability for a friend group: every treat obligation stays tracked until it is genuinely fulfilled. Ignoring a request, delaying, or attending someone else’s outing never clears another person’s treat.

**Leader:** Hamza (`bscs23057@itu.edu.pk`)  
**Access:** Invitation-only allowlist (see `src/config/allowed-members.ts`)

## Stack

- Next.js App Router · React · TypeScript · Tailwind
- Supabase (PostgreSQL + Auth + RLS)
- Resend · Axiom · Vercel

## Quick start

1. **Install**

   ```bash
   npm install
   ```

2. **Secrets**

   - Copy `.env.example` → `.env.local` (already created locally)
   - Fill every `REPLACE_*` value
   - Exact sources: **[SECRETS.md](./SECRETS.md)**

3. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) → Dashboard shell at `/dashboard`.

## Docs

| File | Purpose |
|---|---|
| [SECRETS.md](./SECRETS.md) | Where to get each API key |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design |
| [DEVELOPMENT_CHECKLIST.md](./DEVELOPMENT_CHECKLIST.md) | Phase-by-phase progress |

## Allowed members

Hamza (leader), Adil Baig, Mehar Ali, Moeez Umer, Bilal Chaudhary, Abrar Ahmed, Wahaj Aziz, Emad Sohail, M. Abdullah.

Emails use `<studentId>@itu.edu.pk` (`ALLOWED_EMAIL_DOMAIN`). Override in `.env.local` if needed.

## Current status

**Phase 1 (initialization)** — app shell, routes, env templates, member allowlist, Supabase client stubs.

Next: **Phase 2** — database migrations, RLS, invitations, login.
