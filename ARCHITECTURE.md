# TreatTracker — Architecture

## Overview

TreatTracker is a Next.js App Router application backed by Supabase PostgreSQL and Auth.
Business rules live on the server (Server Actions / Route Handlers). The browser never
holds service-role keys or mock “databases.”

## Stack

| Layer | Choice |
|---|---|
| UI | Next.js App Router, React, TypeScript (strict), Tailwind, Lucide |
| Forms | React Hook Form + Zod |
| Calendar | FullCalendar (Phase 5) |
| Auth + DB | Supabase Auth + PostgreSQL + RLS |
| Email | Resend |
| Logs | Axiom (async) + append-only `audit_logs` in Postgres |
| Hosting | Vercel |

## Core domain rule

**One treat request may create one or more independent obligations.**  
Completing or attending a shared outing never auto-completes another person’s obligation.

Statuses: `PENDING` → `ACCEPTED_UNSCHEDULED` / `SCHEDULED` / `TEMPORARILY_DELAYED` →
`IN_PROGRESS` → `COMPLETION_PENDING` → `COMPLETED` (or `DISPUTED` / `REJECTED` by leader only).

## Roles

- **Leader** — exactly one active account (Hamza / `bscs23057@…`). Invites, rejects, IP auth, overrides.
- **Member** — invited friends only; can request, accept, delay, schedule, confirm, review, tag leader.

## Directory map (Phase 1)

```
src/
  app/                 # routes (auth, dashboard, treats, calendar, leader, …)
  components/layout/   # AppShell, sidebar, placeholders
  components/setup/    # Env / secrets status card
  config/              # allowed-members, navigation
  lib/                 # env, utils, supabase clients
  types/               # treat status enums
```

## Auth gate (Phase 2+)

1. Invitation token (hashed) required to register.
2. Email must be on the allowlist (`src/config/allowed-members.ts`).
3. Login checks authorized devices / IPs; unfamiliar IP → block + security event.
4. RLS + server authorization on every mutation.

## Integrations

Secrets: see `SECRETS.md` and `.env.example`.  
Status UI: Dashboard → Integration setup card.

## Phased delivery

See `DEVELOPMENT_CHECKLIST.md`. Do not mark a feature complete until implemented and tested
against real Supabase data.
