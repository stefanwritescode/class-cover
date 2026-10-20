-- Phase 2: the cover loop.

-- Insurance expiry sits beside first aid; either one expired blocks a teacher from covers.
alter table profiles add column insurance_expiry date;

-- Which covers a teacher wants to be pinged about. Empty array = no restriction.
create table teacher_preferences (
  profile_id uuid primary key references profiles on delete cascade,
  location_ids uuid[] not null default '{}',
  weekdays int[] not null default '{}',          -- 0 = Sunday
  dayparts text[] not null default '{}',         -- morning (<12:00), midday (12-16), evening (16+)
  updated_at timestamptz not null default now()
);
alter table teacher_preferences enable row level security;
create policy "own preferences" on teacher_preferences for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "studios read preferences" on teacher_preferences for select using (private.works_with_teacher(profile_id));

-- Handover notes everyone eligible can see; access details only the covering teacher sees.
alter table cover_requests
  add column urgent boolean not null default false,
  add column notes text,
  add column timetable_class_id uuid references timetable_classes on delete set null;

create table cover_request_access (
  request_id uuid primary key references cover_requests on delete cascade,
  access_notes text
);
alter table cover_request_access enable row level security;

-- Check-in, the manager's confirmation, and the platform fee (R0 while it's free).
alter table cover_assignments
  add column checked_in_at timestamptz,
  add column rating int check (rating between 1 and 5),
  add column manager_note text,
  add column platform_fee int not null default 0;

-- Each location gets a secret code for its reception QR poster.
alter table locations add column checkin_code text unique not null default encode(extensions.gen_random_bytes(9), 'hex');

-- The teacher currently holding a request (not dropped).
create function private.holds_active(p_request uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cover_assignments a
    where a.request_id = p_request and a.teacher_id = auth.uid() and a.dropped_at is null)
$$;

create policy "manager or covering teacher reads access" on cover_request_access for select using (
  private.manages_request(request_id) or private.holds_active(request_id));
create policy "managers write access" on cover_request_access for all using (private.manages_request(request_id))
  with check (private.manages_request(request_id));

-- Eligibility now also covers: the locum wave opening on its own after the head start,
-- urgent requests skipping the head start, classes already started, and expired documents.
create or replace function private.eligible_for(p_request uuid, t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  with r as (
    select cr.*, s.wave_delay_minutes from cover_requests cr join studios s on s.id = cr.studio_id
    where cr.id = p_request
  )
  select exists (
    select 1 from r where r.status = 'open' and r.starts_at > now()
  ) and exists (
    select 1 from r join studio_teachers st on st.studio_id = r.studio_id
    where st.teacher_id = t
      and (st.stage = 'preferred' or (st.stage = 'locum' and (
        r.wave = 'all' or r.urgent or now() >= r.wave_opened_at + make_interval(mins => r.wave_delay_minutes))))
  ) and exists (
    select 1 from r join profile_trainings pt on pt.training_id = any (r.accepted_training_ids)
    where pt.profile_id = t and pt.verified_at is not null
  ) and exists (
    select 1 from r, profiles p where p.id = t
      and (p.first_aid_expiry is null or p.first_aid_expiry >= (r.starts_at at time zone 'Africa/Johannesburg')::date)
      and (p.insurance_expiry is null or p.insurance_expiry >= (r.starts_at at time zone 'Africa/Johannesburg')::date)
  )
$$;

-- Teacher scans the studio's QR at reception: marks today's cover at that location as arrived.
create function public.check_in(p_code text) returns text
language plpgsql security definer set search_path = public, private as $$
declare a_id uuid; cls text;
begin
  select a.id, r.class_name into a_id, cls
  from cover_assignments a
  join cover_requests r on r.id = a.request_id
  join locations l on l.id = r.location_id
  where l.checkin_code = p_code and a.teacher_id = auth.uid() and a.dropped_at is null
    and r.starts_at between now() - interval '2 hours' and now() + interval '3 hours'
  order by r.starts_at limit 1;
  if a_id is null then raise exception 'No cover booked for you here right now'; end if;
  update cover_assignments set checked_in_at = coalesce(checked_in_at, now()) where id = a_id;
  return cls;
end $$;
revoke execute on function public.check_in(text) from public, anon;
grant execute on function public.check_in(text) to authenticated;
