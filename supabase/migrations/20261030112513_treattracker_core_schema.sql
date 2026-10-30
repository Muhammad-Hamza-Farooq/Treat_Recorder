-- TreatTracker core schema
create extension if not exists pgcrypto;

create type public.user_role as enum ('leader', 'member');
create type public.account_status as enum ('active', 'suspended', 'pending');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type public.treat_status as enum (
  'PENDING','ACCEPTED_UNSCHEDULED','SCHEDULED','IN_PROGRESS',
  'TEMPORARILY_DELAYED','COMPLETION_PENDING','COMPLETED','DISPUTED','REJECTED'
);
create type public.attendance_status as enum ('invited','confirmed','attended','did_not_attend','excused');
create type public.completion_method as enum ('dual_confirm','leader_override');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  avatar_url text,
  role public.user_role not null default 'member',
  account_status public.account_status not null default 'pending',
  timezone text not null default 'Asia/Karachi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create unique index profiles_one_leader on public.profiles ((role)) where role = 'leader' and account_status = 'active';

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invited_name text not null,
  token_hash text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  invited_by uuid references public.profiles(id),
  accepted_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.treat_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id),
  primary_giver_id uuid not null references public.profiles(id),
  reason text not null,
  achievement_description text not null,
  requested_treat text,
  additional_notes text,
  request_status public.treat_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rejected_at timestamptz,
  rejected_by uuid references public.profiles(id),
  rejection_reason text,
  constraint treat_requests_not_self check (requester_id <> primary_giver_id)
);

create table public.treat_obligations (
  id uuid primary key default gen_random_uuid(),
  treat_request_id uuid not null references public.treat_requests(id) on delete cascade,
  giver_id uuid not null references public.profiles(id),
  requester_id uuid not null references public.profiles(id),
  status public.treat_status not null default 'PENDING',
  accepted_at timestamptz,
  scheduled_at timestamptz,
  timezone text default 'Asia/Karachi',
  location text,
  scheduling_reason text,
  delay_reason text,
  completed_at timestamptz,
  completion_method public.completion_method,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint treat_obligations_not_self check (giver_id <> requester_id)
);

create table public.treat_responses (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null references public.treat_obligations(id) on delete cascade,
  responder_id uuid not null references public.profiles(id),
  response_type text not null,
  explanation text,
  previous_status public.treat_status,
  new_status public.treat_status,
  created_at timestamptz not null default now()
);

create table public.treat_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organizer_id uuid not null references public.profiles(id),
  location text,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'Asia/Karachi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.treat_events(id) on delete cascade,
  obligation_id uuid references public.treat_obligations(id),
  member_id uuid not null references public.profiles(id),
  attendance_status public.attendance_status not null default 'invited',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, member_id)
);

create table public.treat_confirmations (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null references public.treat_obligations(id) on delete cascade,
  confirmer_id uuid not null references public.profiles(id),
  confirmation_type text not null default 'completed',
  confirmed_at timestamptz not null default now(),
  notes text,
  unique (obligation_id, confirmer_id)
);

create table public.treat_reviews (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null references public.treat_obligations(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  location_description text,
  experience_description text,
  food_or_activity text,
  rating int not null check (rating between 1 and 5),
  recommended boolean,
  comments text,
  photo_urls text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (obligation_id, reviewer_id)
);

create table public.leader_interventions (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null references public.treat_obligations(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  intervention_reason text not null,
  leader_id uuid references public.profiles(id),
  action_taken text,
  decision_reason text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.treat_notes (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null references public.treat_obligations(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  note_type text not null default 'general',
  note_content text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  related_obligation_id uuid references public.treat_obligations(id) on delete set null,
  related_event_id uuid references public.treat_events(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  event_type text not null,
  entity_type text,
  entity_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.authorized_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ip_address text not null,
  device_fingerprint_hash text,
  user_agent text,
  authorization_status text not null default 'authorized',
  authorized_by uuid references public.profiles(id),
  authorized_at timestamptz not null default now(),
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  attempted_email text,
  attempted_ip text,
  user_agent text,
  event_type text not null,
  event_details jsonb not null default '{}'::jsonb,
  resolution_status text not null default 'open',
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create table public.email_delivery_log (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  to_email text not null,
  template text not null,
  status text not null,
  provider_id text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_obligations_giver on public.treat_obligations(giver_id);
create index idx_obligations_requester on public.treat_obligations(requester_id);
create index idx_obligations_status on public.treat_obligations(status);
create index idx_obligations_scheduled on public.treat_obligations(scheduled_at);
create index idx_notifications_recipient on public.notifications(recipient_id, created_at desc);
create index idx_audit_created on public.audit_logs(created_at desc);
create index idx_invitations_email on public.invitations(email);
