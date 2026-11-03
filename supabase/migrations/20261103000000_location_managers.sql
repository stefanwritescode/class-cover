-- Managers can be limited to some of a studio's locations. An empty list means every location.
alter table studio_managers add column location_ids uuid[] not null default '{}';

create function private.manages_location(loc uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from studio_managers m join locations l on l.studio_id = m.studio_id
    where l.id = loc and m.profile_id = auth.uid()
      and (cardinality(m.location_ids) = 0 or loc = any (m.location_ids)))
$$;

create function private.manages_whole_studio(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from studio_managers where studio_id = s and profile_id = auth.uid() and cardinality(location_ids) = 0)
$$;

create or replace function private.manages_request(p_request uuid) returns boolean
language sql stable security definer set search_path = public, private as $$
  select exists (select 1 from cover_requests r where r.id = p_request and private.manages_location(r.location_id))
$$;

-- Studio settings and the list of locations belong to whole-studio managers.
drop policy "managers update studio settings" on studios;
create policy "managers update studio settings" on studios for update using (private.manages_whole_studio(id) or private.is_platform_admin());

drop policy "read locations" on locations;
create policy "read locations" on locations for select using (
  private.manages_location(id) or private.teaches_at(studio_id) or private.is_platform_admin());
drop policy "managers edit locations" on locations;
create policy "managers edit locations" on locations for all using (private.manages_whole_studio(studio_id)) with check (private.manages_whole_studio(studio_id));

drop policy "read timetable" on timetable_classes;
create policy "read timetable" on timetable_classes for select using (
  private.manages_location(location_id) or exists (select 1 from locations l where l.id = location_id and private.teaches_at(l.studio_id)));
drop policy "managers edit timetable" on timetable_classes;
create policy "managers edit timetable" on timetable_classes for all using (private.manages_location(location_id)) with check (private.manages_location(location_id));

drop policy "managers read requests" on cover_requests;
create policy "managers read requests" on cover_requests for select using (private.manages_location(location_id) or private.is_platform_admin());
drop policy "managers post requests" on cover_requests;
create policy "managers post requests" on cover_requests for insert with check (
  private.manages_location(location_id)
  and exists (select 1 from locations l join studios s on s.id = l.studio_id
              where l.id = location_id and s.id = studio_id and s.status = 'approved'));
drop policy "managers update requests" on cover_requests;
create policy "managers update requests" on cover_requests for update using (private.manages_location(location_id));

-- Pre-approved managers: the first time someone confirms this email, they become a manager.
create table manager_invites (
  email text primary key check (email = lower(email)),
  full_name text not null,
  studio_id uuid not null references studios on delete cascade,
  location_ids uuid[] not null default '{}',
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table manager_invites enable row level security;
create policy "admin manages invites" on manager_invites for all using (private.is_platform_admin()) with check (private.is_platform_admin());

create function private.claim_manager_invite() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv manager_invites;
begin
  if new.email_confirmed_at is null then return new; end if;
  select * into inv from manager_invites where email = lower(new.email) and claimed_at is null;
  if not found then return new; end if;

  insert into profiles (id, full_name) values (new.id, inv.full_name) on conflict (id) do nothing;
  insert into studio_managers (studio_id, profile_id, location_ids) values (inv.studio_id, new.id, inv.location_ids)
    on conflict (studio_id, profile_id) do update set location_ids = excluded.location_ids;
  update manager_invites set claimed_at = now() where email = inv.email;
  return new;
end $$;

create trigger claim_manager_invite
  after insert or update of email_confirmed_at on auth.users
  for each row execute function private.claim_manager_invite();
