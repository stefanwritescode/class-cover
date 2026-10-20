-- Keep policy helper functions out of the public API.
-- Policies reference functions by id, so they keep working after the move.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.is_platform_admin() set schema private;
alter function public.manages_studio(uuid) set schema private;
alter function public.manages_any_approved_studio() set schema private;
alter function public.works_with_teacher(uuid) set schema private;
alter function public.teaches_at(uuid) set schema private;
alter function public.eligible_for(uuid, uuid) set schema private;
alter function public.manages_request(uuid) set schema private;
alter function public.holds_request(uuid) set schema private;

-- Helpers call each other unqualified, so they need both schemas on their path.
alter function private.manages_request(uuid) set search_path = public, private;
alter function public.accept_cover(uuid) set search_path = public, private;
alter function public.drop_cover(uuid) set search_path = public, private;

-- Only signed-in users can accept or drop a cover.
revoke execute on function public.accept_cover(uuid) from public, anon;
revoke execute on function public.drop_cover(uuid) from public, anon;
grant execute on function public.accept_cover(uuid) to authenticated;
grant execute on function public.drop_cover(uuid) to authenticated;
