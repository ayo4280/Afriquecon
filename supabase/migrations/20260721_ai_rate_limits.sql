-- Keep the public AI assistant from exhausting provider quotas.
create table if not exists public.ai_rate_limits (
  key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0
);

alter table public.ai_rate_limits enable row level security;

create or replace function public.consume_ai_rate_limit(
  p_key text,
  p_limit integer default 10,
  p_window_seconds integer default 600
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_window timestamptz;
  current_count integer;
begin
  if p_key is null or p_key = '' or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_key));
  select window_started_at, request_count
    into current_window, current_count
    from public.ai_rate_limits
   where key = p_key
   for update;

  if not found or current_window + make_interval(secs => p_window_seconds) <= now() then
    insert into public.ai_rate_limits(key, window_started_at, request_count)
    values (p_key, now(), 1)
    on conflict (key) do update
      set window_started_at = excluded.window_started_at,
          request_count = excluded.request_count;
    return true;
  end if;

  if current_count >= p_limit then
    return false;
  end if;

  update public.ai_rate_limits
     set request_count = current_count + 1
   where key = p_key;
  return true;
end;
$$;

revoke all on function public.consume_ai_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_rate_limit(text, integer, integer) to service_role;
