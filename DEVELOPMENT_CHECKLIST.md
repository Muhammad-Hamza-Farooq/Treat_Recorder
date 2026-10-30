# TreatTracker — Development Checklist

## Group roster (invitation-only)

| Name | Email (domain `itu.edu.pk`) | Role |
|---|---|---|
| Hamza | bscs23057@itu.edu.pk | **Leader** |
| Adil Baig | bscs23054@itu.edu.pk | Member |
| Mehar Ali | bscs23087@itu.edu.pk | Member |
| Moeez Umer | bscs23150@itu.edu.pk | Member |
| Bilal Chaudhary | bscs23172@itu.edu.pk | Member |
| Abrar Ahmed | bscs23093@itu.edu.pk | Member |
| Wahaj Aziz | bscs23107@itu.edu.pk | Member |
| Emad Sohail | bscs23117@itu.edu.pk | Member |
| M. Abdullah | bscs23202@itu.edu.pk | Member |

---

## Phase 1 — Project initialization

- [x] Inspect empty repository
- [x] Scaffold Next.js (App Router) + TypeScript + Tailwind
- [x] Install core deps (Supabase SSR, Zod, RHF, Lucide, Vitest)
- [x] Create `.env.example` + `.env.local` + `SECRETS.md`
- [x] Allowed members config (Hamza = leader)
- [x] Responsive dashboard shell + sidebar navigation
- [x] All required route placeholders
- [x] Supabase client/server stubs
- [x] Treat status types + color legend
- [x] Development checklist + architecture notes
- [x] `npm run build` verified
- [x] Allowlist unit tests passing
- [ ] Secrets filled in `.env.local` by operator (you)
- [ ] `npm run dev` smoke-checked in browser

## Phase 2 — Database and authentication

- [ ] Supabase migrations (full schema)
- [ ] RLS policies
- [ ] Invitation registration flow
- [ ] Login / logout / password reset
- [ ] Leader bootstrap (Hamza)
- [ ] Member profiles

## Phase 3 — Treat management

- [ ] Request form + independent obligations
- [ ] Accept / unscheduled / delay / schedule
- [ ] Leader reject + intervention tagging
- [ ] Request history

## Phase 4 — Group outings

- [ ] Events + attendees
- [ ] Link multiple obligations
- [ ] Independent completion (no auto-complete)

## Phase 5 — Calendar

- [ ] FullCalendar views
- [ ] Unscheduled obligations panel
- [ ] Filters + detail drawer

## Phase 6 — Completion and reviews

- [ ] Dual confirmations + disputes
- [ ] Leader override (audited)
- [ ] Reviews + optional photos

## Phase 7 — Leader administration

- [ ] Admin dashboard + intervention queue
- [ ] User management + app settings

## Phase 8 — Email and notifications

- [ ] Resend templates + delivery tracking
- [ ] In-app notifications + cron reminders

## Phase 9 — Security and logging

- [ ] Axiom + append-only `audit_logs`
- [ ] Unfamiliar IP blocking + leader authorization
- [ ] Rate limiting + security center

## Phase 10 — Testing and deployment

- [ ] Vitest + RTL + Playwright suites
- [ ] RLS adversarial tests
- [ ] Production build + Vercel + docs complete
