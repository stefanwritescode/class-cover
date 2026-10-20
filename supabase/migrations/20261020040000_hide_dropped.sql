-- A teacher who handed a class back doesn't see it, or get pinged for it, again.
create or replace function private.eligible_for(p_request uuid, t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  with r as (
    select cr.*, s.wave_delay_minutes from cover_requests cr join studios s on s.id = cr.studio_id
    where cr.id = p_request
  )
  select exists (
    select 1 from r where r.status = 'open' and r.starts_at > now()
  ) and not exists (
    select 1 from cover_assignments a where a.request_id = p_request and a.teacher_id = t
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
