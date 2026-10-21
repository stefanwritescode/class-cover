-- WhatsApp alerts. Each alert is recorded once per teacher per wave, so a re-run never double-sends.
alter table notifications add column wave_key timestamptz, add column detail text;
create unique index notifications_once on notifications (request_id, teacher_id, channel, wave_key);

-- Who should get a WhatsApp for this request right now: eligible to accept, opted in,
-- available by their preferences, and not yet alerted for the current wave.
create function public.notify_targets(p_request uuid)
returns table (teacher_id uuid, full_name text, phone text, manychat_subscriber_id text, wave_key timestamptz)
language sql stable security definer set search_path = public, private as $$
  with r as (
    select cr.*, s.wave_delay_minutes,
      (cr.starts_at at time zone 'Africa/Johannesburg') as local_start
    from cover_requests cr join studios s on s.id = cr.studio_id
    where cr.id = p_request and cr.status = 'open' and cr.starts_at > now()
  )
  select p.id, p.full_name, c.phone, c.manychat_subscriber_id, r.wave_opened_at
  from r
  join studio_teachers st on st.studio_id = r.studio_id
  join profiles p on p.id = st.teacher_id
  join profile_contacts c on c.profile_id = p.id and c.whatsapp_opt_in and coalesce(c.phone, '') <> ''
  left join teacher_preferences tp on tp.profile_id = p.id
  where (st.stage = 'preferred' or (st.stage = 'locum' and (
          r.wave = 'all' or r.urgent or now() >= r.wave_opened_at + make_interval(mins => r.wave_delay_minutes))))
    and exists (select 1 from profile_trainings pt where pt.profile_id = p.id and pt.verified_at is not null
                and pt.training_id = any (r.accepted_training_ids))
    and not exists (select 1 from cover_assignments a where a.request_id = r.id and a.teacher_id = p.id)
    and (p.first_aid_expiry is null or p.first_aid_expiry >= r.local_start::date)
    and (p.insurance_expiry is null or p.insurance_expiry >= r.local_start::date)
    and (tp.profile_id is null or cardinality(tp.location_ids) = 0 or r.location_id = any (tp.location_ids))
    and (tp.profile_id is null or cardinality(tp.weekdays) = 0 or extract(dow from r.local_start)::int = any (tp.weekdays))
    and (tp.profile_id is null or cardinality(tp.dayparts) = 0 or
         (case when extract(hour from r.local_start) < 12 then 'morning'
               when extract(hour from r.local_start) < 16 then 'midday' else 'evening' end) = any (tp.dayparts))
    and not exists (select 1 from notifications n where n.request_id = r.id and n.teacher_id = p.id
                    and n.channel = 'whatsapp' and n.wave_key = r.wave_opened_at)
$$;
revoke execute on function public.notify_targets(uuid) from public, anon, authenticated;
grant execute on function public.notify_targets(uuid) to service_role;
