-- Fix: the server (service_role) must be able to execute the step-lock RPC.
-- Run this once in the Supabase SQL editor if a fresh /step call 500s with a
-- permission error. Idempotent — safe to run anytime.

create or replace function public.claim_evaluation(p_eval_id uuid, p_lock_seconds int)
returns setof public.evaluations
language sql
security definer set search_path = public
as $$
  update public.evaluations
  set lock_until = now() + make_interval(secs => p_lock_seconds)
  where id = p_eval_id
    and (lock_until is null or lock_until < now())
  returning *;
$$;

revoke all on function public.claim_evaluation(uuid, int) from public, anon, authenticated;
grant execute on function public.claim_evaluation(uuid, int) to service_role;
