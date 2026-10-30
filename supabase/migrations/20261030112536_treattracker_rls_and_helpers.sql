-- Helper: current profile id
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_leader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and role = 'leader'
      and account_status = 'active'
  );
$$;

create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and account_status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.treat_requests enable row level security;
alter table public.treat_obligations enable row level security;
alter table public.treat_responses enable row level security;
alter table public.treat_events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.treat_confirmations enable row level security;
alter table public.treat_reviews enable row level security;
alter table public.leader_interventions enable row level security;
alter table public.treat_notes enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.authorized_devices enable row level security;
alter table public.security_events enable row level security;
alter table public.app_settings enable row level security;
alter table public.email_delivery_log enable row level security;

-- Profiles: members read all active profiles; update own non-role fields via trigger later
create policy profiles_select_active on public.profiles for select to authenticated
  using (public.is_active_member() or public.is_leader());

create policy profiles_update_self on public.profiles for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid() and role = (select role from public.profiles where auth_user_id = auth.uid()));

create policy profiles_leader_all on public.profiles for all to authenticated
  using (public.is_leader()) with check (public.is_leader());

-- Transparency: authenticated active members can read group treat data
create policy treat_requests_select on public.treat_requests for select to authenticated using (public.is_active_member());
create policy treat_requests_insert on public.treat_requests for insert to authenticated
  with check (requester_id = public.current_profile_id() and public.is_active_member());
create policy treat_requests_leader on public.treat_requests for update to authenticated using (public.is_leader());

create policy obligations_select on public.treat_obligations for select to authenticated using (public.is_active_member());
create policy obligations_update_parties on public.treat_obligations for update to authenticated
  using (giver_id = public.current_profile_id() or requester_id = public.current_profile_id() or public.is_leader());

create policy responses_select on public.treat_responses for select to authenticated using (public.is_active_member());
create policy responses_insert on public.treat_responses for insert to authenticated
  with check (responder_id = public.current_profile_id());

create policy events_select on public.treat_events for select to authenticated using (public.is_active_member());
create policy events_insert on public.treat_events for insert to authenticated
  with check (organizer_id = public.current_profile_id() or public.is_leader());
create policy events_update on public.treat_events for update to authenticated
  using (organizer_id = public.current_profile_id() or public.is_leader());

create policy attendees_select on public.event_attendees for select to authenticated using (public.is_active_member());
create policy attendees_write on public.event_attendees for all to authenticated
  using (public.is_active_member()) with check (public.is_active_member());

create policy confirmations_select on public.treat_confirmations for select to authenticated using (public.is_active_member());
create policy confirmations_insert on public.treat_confirmations for insert to authenticated
  with check (confirmer_id = public.current_profile_id());

create policy reviews_select on public.treat_reviews for select to authenticated using (public.is_active_member());
create policy reviews_insert on public.treat_reviews for insert to authenticated
  with check (reviewer_id = public.current_profile_id());
create policy reviews_update on public.treat_reviews for update to authenticated
  using (reviewer_id = public.current_profile_id());

create policy interventions_select on public.leader_interventions for select to authenticated using (public.is_active_member());
create policy interventions_insert on public.leader_interventions for insert to authenticated
  with check (requested_by = public.current_profile_id());
create policy interventions_leader on public.leader_interventions for update to authenticated using (public.is_leader());

create policy notes_select on public.treat_notes for select to authenticated using (public.is_active_member());
create policy notes_insert on public.treat_notes for insert to authenticated
  with check (author_id = public.current_profile_id());

create policy notifications_own on public.notifications for select to authenticated
  using (recipient_id = public.current_profile_id() or public.is_leader());
create policy notifications_update_own on public.notifications for update to authenticated
  using (recipient_id = public.current_profile_id());

create policy audit_select_leader on public.audit_logs for select to authenticated using (public.is_leader());
create policy audit_insert_authenticated on public.audit_logs for insert to authenticated with check (true);

create policy devices_own_select on public.authorized_devices for select to authenticated
  using (user_id = public.current_profile_id() or public.is_leader());
create policy devices_leader on public.authorized_devices for all to authenticated
  using (public.is_leader()) with check (public.is_leader());

create policy security_leader on public.security_events for all to authenticated
  using (public.is_leader()) with check (public.is_leader());

create policy invitations_leader on public.invitations for all to authenticated
  using (public.is_leader()) with check (public.is_leader());

create policy settings_leader on public.app_settings for all to authenticated
  using (public.is_leader()) with check (public.is_leader());
create policy settings_read on public.app_settings for select to authenticated using (public.is_active_member());

create policy email_log_leader on public.email_delivery_log for select to authenticated using (public.is_leader());

-- Prevent role escalation via update
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_leader() then
    raise exception 'Cannot change role';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_no_role_escalation
before update on public.profiles
for each row execute function public.prevent_role_escalation();

insert into public.app_settings (key, value) values
  ('invitation_expiry_days', '7'::jsonb),
  ('reminder_unanswered_days', '3'::jsonb),
  ('reminder_unscheduled_days', '7'::jsonb),
  ('review_edit_hours', '48'::jsonb)
on conflict (key) do nothing;
