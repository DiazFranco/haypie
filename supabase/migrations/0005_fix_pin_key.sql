-- Fix final del GUC: PostgREST guarda los headers en `request.headers` con el
-- nombre completo del header (ej. `request.pin`), no solo `pin`.
-- Además se elimina la función de debug temporal.

create or replace function current_pin()
returns text
language sql
immutable
as $$
  select coalesce(current_setting('request.headers', true)::jsonb ->> 'request.pin', '')
$$;

drop function if exists public.debug_pin();