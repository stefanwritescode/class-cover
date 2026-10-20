-- Class Cover: initial schema
-- Teachers own their profile; each studio holds its own link to a teacher.
-- Money is stored in whole rands (integer). Times are timestamptz (Africa/Johannesburg in the UI).

create extension if not exists pgcrypto;

-- ---------- Types ----------
create type visibility as enum ('studios_i_work_with', 'verified_studios');
create type studio_status as enum ('pending', 'approved', 'suspended');
create type link_stage as enum ('to_meet', 'checking_documents', 'locum', 'preferred', 'declined');
create type request_wave as enum ('preferred', 'all');
create type request_status as enum ('open', 'filled', 'cancelled');
create type notify_channel as enum ('push', 'whatsapp', 'email');

-- ---------- People ----------
-- Public-facing profile. What verified studios may see in the marketplace.
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  area text,
  bio text,
  years_teaching int,
  first_aid_expiry date,
  visibility visibility not null default 'verified_studios',
  open_to text[] not null default array['cover', 'locum'],
  is_platform_admin boolean not null default false,
  popia_consent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Contact details. Shared only with studios the teacher works with.
create table profile_contacts (
  profile_id uuid primary key references profiles on delete cascade,
  phone text,
  whatsapp_opt_in boolean not null default false,
  manychat_subscriber_id text
);

-- Sensitive details. Self, platform admin, and studios that pay the teacher.
create table profile_private (
  profile_id uuid primary key references profiles on delete cascade,
  id_number text,
  bank_name text,
  bank_account_number text,
  bank_branch_code text
);

create table trainings (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  provider text not null
);

create table profile_trainings (
  profile_id uuid references profiles on delete cascade,
  training_id uuid references trainings on delete restrict,
  certificate_path text,          -- storage path in the private 'certificates' bucket
  verified_at timestamptz,
  verified_by uuid references profiles,
  primary key (profile_id, training_id)
);

-- ---------- Studios ----------
create table studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status studio_status not null default 'pending',
  default_rate int not null default 275,
  meet_first boolean not null default true,
  dropout_limit int not null default 3,
  wave_delay_minutes int not null default 15,
  created_at timestamptz not null default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios on delete cascade,
  name text not null,
  address text
);

create table studio_managers (
  studio_id uuid references studios on delete cascade,
  profile_id uuid references profiles on delete cascade,
  primary key (studio_id, profile_id)
);

-- The studio's relationship with a teacher.
create table studio_teachers (
  studio_id uuid references studios on delete cascade,
  teacher_id uuid references profiles on delete cascade,
  stage link_stage not null default 'to_meet',
  notes text,
  created_at timestamptz not null default now(),
  primary key (studio_id, teacher_id)
);

-- Regular timetable, used to fill in a cover request quickly.
create table timetable_classes (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations on delete cascade,
  name text not null,
  weekday int not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  duration_minutes int not null default 50,
  accepted_training_ids uuid[] not null default '{}'
);

-- ---------- Covers ----------
create table cover_requests (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios on delete cascade,
  location_id uuid not null references locations,
  class_name text not null,
  starts_at timestamptz not null,
  duration_minutes int not null default 50,
  reason text,
  rate int not null,
  accepted_training_ids uuid[] not null,
  wave request_wave not null default 'preferred',
  wave_opened_at timestamptz not null default now(),
  status request_status not null default 'open',
  created_by uuid references profiles,
  created_at timestamptz not null default now()
);

-- Who took a cover. A dropout keeps its row (dropped_at set) so it counts against the teacher.
create table cover_assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references cover_requests on delete cascade,
  teacher_id uuid not null references profiles,
  rate int not null,
  accepted_at timestamptz not null default now(),
  dropped_at timestamptz,
  late_dropout boolean not null default false,
  confirmed_at timestamptz,     -- manager confirms the class ran
  paid_at timestamptz
);
create unique index one_active_assignment on cover_assignments (request_id) where dropped_at is null;

create table notifications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references cover_requests on delete cascade,
  teacher_id uuid not null references profiles on delete cascade,
  channel notify_channel not null,
  sent_at timestamptz not null default now(),
  status text not null default 'sent'
);

-- ---------- Helper functions ----------
create function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_admin from profiles where id = auth.uid()), false)
$$;

create function manages_studio(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from studio_managers where studio_id = s and profile_id = auth.uid())
$$;

create function manages_any_approved_studio() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from studio_managers m join studios s on s.id = m.studio_id
    where m.profile_id = auth.uid() and s.status = 'approved')
$$;

-- True when the caller manages a studio that works with this teacher (any stage except declined).
create function works_with_teacher(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from studio_teachers st join studio_managers m on m.studio_id = st.studio_id
    where st.teacher_id = t and m.profile_id = auth.uid() and st.stage <> 'declined')
$$;

-- True when the caller is approved (locum/preferred) at the studio.
create function teaches_at(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from studio_teachers
    where studio_id = s and teacher_id = auth.uid() and stage in ('locum', 'preferred'))
$$;

-- Can this teacher take this request right now? Approved at the studio, trained, right wave.
create function eligible_for(p_request uuid, t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  with r as (select * from cover_requests where id = p_request)
  select exists (
    select 1 from r where r.status = 'open'
  ) and exists (
    select 1 from r join studio_teachers st on st.studio_id = r.studio_id
    where st.teacher_id = t
      and (st.stage = 'preferred' or (st.stage = 'locum' and r.wave = 'all'))
  ) and exists (
    select 1 from r join profile_trainings pt on pt.training_id = any (r.accepted_training_ids)
    where pt.profile_id = t and pt.verified_at is not null
  )
$$;

-- Used by policies on both covers tables, so they don't query each other through RLS.
create function manages_request(p_request uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cover_requests r where r.id = p_request and manages_studio(r.studio_id))
$$;

create function holds_request(p_request uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cover_assignments a where a.request_id = p_request and a.teacher_id = auth.uid())
$$;

-- ---------- Actions ----------
-- First to accept wins. Locks the row so two teachers can't both take it.
create function accept_cover(p_request uuid) returns cover_assignments
language plpgsql security definer set search_path = public as $$
declare r cover_requests; a cover_assignments;
begin
  select * into r from cover_requests where id = p_request for update;
  if r.id is null or r.status <> 'open' then
    raise exception 'This cover has already been taken or cancelled';
  end if;
  if not eligible_for(r.id, auth.uid()) then
    raise exception 'You are not eligible for this cover';
  end if;
  if exists (select 1 from cover_assignments where request_id = r.id and teacher_id = auth.uid()) then
    raise exception 'You already dropped this cover';
  end if;
  insert into cover_assignments (request_id, teacher_id, rate)
    values (r.id, auth.uid(), r.rate) returning * into a;
  update cover_requests set status = 'filled' where id = r.id;
  return a;
end $$;

-- Teacher can't make it: hand back, re-open from the preferred wave, count late dropouts,
-- and move a preferred teacher to locum once they hit the studio's limit this quarter.
create function drop_cover(p_assignment uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a cover_assignments; r cover_requests; s studios; late boolean; n int;
begin
  select * into a from cover_assignments where id = p_assignment and teacher_id = auth.uid() and dropped_at is null for update;
  if a.id is null then raise exception 'Cover not found'; end if;
  select * into r from cover_requests where id = a.request_id for update;
  select * into s from studios where id = r.studio_id;
  late := r.starts_at - now() < interval '24 hours';
  update cover_assignments set dropped_at = now(), late_dropout = late where id = a.id;
  update cover_requests set status = 'open', wave = 'preferred', wave_opened_at = now() where id = r.id;
  if late then
    select count(*) into n from cover_assignments ca join cover_requests cr on cr.id = ca.request_id
      where ca.teacher_id = auth.uid() and cr.studio_id = s.id and ca.late_dropout
        and ca.dropped_at >= date_trunc('quarter', now());
    if n >= s.dropout_limit then
      update studio_teachers set stage = 'locum'
        where studio_id = s.id and teacher_id = auth.uid() and stage = 'preferred';
    end if;
  end if;
end $$;

-- ---------- Row-level security ----------
alter table profiles enable row level security;
alter table profile_contacts enable row level security;
alter table profile_private enable row level security;
alter table trainings enable row level security;
alter table profile_trainings enable row level security;
alter table studios enable row level security;
alter table locations enable row level security;
alter table studio_managers enable row level security;
alter table studio_teachers enable row level security;
alter table timetable_classes enable row level security;
alter table cover_requests enable row level security;
alter table cover_assignments enable row level security;
alter table notifications enable row level security;

-- profiles
create policy "read own, linked, or marketplace profiles" on profiles for select using (
  id = auth.uid() or is_platform_admin() or works_with_teacher(id)
  or (visibility = 'verified_studios' and manages_any_approved_studio())
);
create policy "insert own profile" on profiles for insert with check (id = auth.uid() and not is_platform_admin);
create policy "update own profile" on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and is_platform_admin = is_platform_admin());

-- contacts: self and studios that work with the teacher
create policy "read contacts" on profile_contacts for select using (
  profile_id = auth.uid() or is_platform_admin() or works_with_teacher(profile_id));
create policy "write own contacts" on profile_contacts for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- private: self, platform admin, and studios where the teacher is approved (they pay them)
create policy "read private" on profile_private for select using (
  profile_id = auth.uid() or is_platform_admin() or exists (
    select 1 from studio_teachers st where st.teacher_id = profile_private.profile_id
      and st.stage in ('locum', 'preferred') and manages_studio(st.studio_id)));
create policy "write own private" on profile_private for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- trainings list is public to signed-in users
create policy "read trainings" on trainings for select using (auth.uid() is not null);

create policy "read profile trainings" on profile_trainings for select using (
  profile_id = auth.uid() or is_platform_admin() or works_with_teacher(profile_id)
  or (manages_any_approved_studio() and exists (
    select 1 from profiles p where p.id = profile_id and p.visibility = 'verified_studios')));
create policy "teacher adds own trainings" on profile_trainings for insert with check (profile_id = auth.uid() and verified_at is null);
create policy "teacher removes own trainings" on profile_trainings for delete using (profile_id = auth.uid());
create policy "manager or admin verifies" on profile_trainings for update using (is_platform_admin() or works_with_teacher(profile_id));

-- studios
create policy "read studios" on studios for select using (
  is_platform_admin() or manages_studio(id) or teaches_at(id) or status = 'approved');
create policy "anyone can apply to add a studio" on studios for insert with check (auth.uid() is not null and status = 'pending');
create policy "managers update studio settings" on studios for update using (manages_studio(id) or is_platform_admin());

create policy "read locations" on locations for select using (manages_studio(studio_id) or teaches_at(studio_id) or is_platform_admin());
create policy "managers edit locations" on locations for all using (manages_studio(studio_id)) with check (manages_studio(studio_id));

create policy "read managers" on studio_managers for select using (profile_id = auth.uid() or manages_studio(studio_id) or is_platform_admin());
create policy "admin assigns managers" on studio_managers for all using (is_platform_admin()) with check (is_platform_admin());

create policy "read studio links" on studio_teachers for select using (teacher_id = auth.uid() or manages_studio(studio_id) or is_platform_admin());
create policy "managers manage links" on studio_teachers for all using (manages_studio(studio_id)) with check (manages_studio(studio_id));

create policy "read timetable" on timetable_classes for select using (exists (
  select 1 from locations l where l.id = location_id and (manages_studio(l.studio_id) or teaches_at(l.studio_id))));
create policy "managers edit timetable" on timetable_classes for all using (exists (
  select 1 from locations l where l.id = location_id and manages_studio(l.studio_id)))
  with check (exists (select 1 from locations l where l.id = location_id and manages_studio(l.studio_id)));

-- cover requests: managers see their studio's; teachers see open ones they're eligible for, and ones they hold
create policy "managers read requests" on cover_requests for select using (manages_studio(studio_id) or is_platform_admin());
create policy "teachers read eligible or held requests" on cover_requests for select using (
  eligible_for(id, auth.uid()) or holds_request(id));
create policy "managers post requests" on cover_requests for insert with check (
  manages_studio(studio_id) and exists (select 1 from studios s where s.id = studio_id and s.status = 'approved'));
create policy "managers update requests" on cover_requests for update using (manages_studio(studio_id));

-- assignments are created only through accept_cover / drop_cover
create policy "read assignments" on cover_assignments for select using (
  teacher_id = auth.uid() or is_platform_admin() or manages_request(request_id));
create policy "managers confirm and mark paid" on cover_assignments for update using (manages_request(request_id));

create policy "read notifications" on notifications for select using (
  teacher_id = auth.uid() or manages_request(request_id));

-- ---------- Storage: private certificates bucket ----------
insert into storage.buckets (id, name, public) values ('certificates', 'certificates', false)
  on conflict (id) do nothing;
create policy "teachers upload own certificates" on storage.objects for insert with check (
  bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read certificates" on storage.objects for select using (
  bucket_id = 'certificates' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or is_platform_admin()
    or works_with_teacher(((storage.foldername(name))[1])::uuid)));

-- ---------- Seed: training courses ----------
insert into trainings (name, provider) values
  ('Stretch Reformer', 'Stretch Pilates'),
  ('Stretch Mat', 'Stretch Pilates'),
  ('BASI Comprehensive', 'BASI'),
  ('BASI Mat', 'BASI'),
  ('STOTT Reformer', 'STOTT'),
  ('STOTT Mat', 'STOTT'),
  ('Polestar Comprehensive', 'Polestar'),
  ('Polestar Mat', 'Polestar');
