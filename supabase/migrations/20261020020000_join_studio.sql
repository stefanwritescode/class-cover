-- A signed-up teacher applies to an approved studio. They start at "to meet" or
-- "checking documents" depending on the studio's meet-first setting.
create function public.request_to_join(p_studio uuid) returns link_stage
language plpgsql security definer set search_path = public, private as $$
declare s studios; st link_stage;
begin
  if not exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'Finish your profile first';
  end if;
  select * into s from studios where id = p_studio and status = 'approved';
  if s.id is null then raise exception 'Studio not found'; end if;
  st := case when s.meet_first then 'to_meet'::link_stage else 'checking_documents'::link_stage end;
  insert into studio_teachers (studio_id, teacher_id, stage) values (s.id, auth.uid(), st)
    on conflict (studio_id, teacher_id) do nothing;
  return (select stage from studio_teachers where studio_id = s.id and teacher_id = auth.uid());
end $$;

revoke execute on function public.request_to_join(uuid) from public, anon;
grant execute on function public.request_to_join(uuid) to authenticated;

-- Teachers can replace a certificate file they uploaded.
create policy "teachers update own certificates" on storage.objects for update using (
  bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text);
