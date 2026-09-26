-- Fix RLS: PostgREST no expone headers como GUC individuales. El PIN viaja
-- en el GUC `request.headers` (JSON, claves en minúscula). Se redefine
-- current_pin() y se recrean todas las políticas usándola.

create or replace function current_pin()
returns text
language sql
immutable
as $$
  select coalesce(current_setting('request.headers', true)::jsonb ->> 'request.pin', '')
$$;

drop policy if exists "mesa_insert_with_pin" on public.mesa;
create policy "mesa_insert_with_pin" on public.mesa
  for insert with check (secret(join_code, current_pin()));

drop policy if exists "player_read_with_pin" on public.player;
create policy "player_read_with_pin" on public.player
  for select using (secret(
    (select m.join_code from public.mesa m where m.id = mesa_id),
    current_pin()
  ));

drop policy if exists "player_write_with_pin" on public.player;
create policy "player_write_with_pin" on public.player
  for insert with check (secret(
    (select m.join_code from public.mesa m where m.id = mesa_id),
    current_pin()
  ));

drop policy if exists "match_read_with_pin" on public.match;
create policy "match_read_with_pin" on public.match
  for select using (secret(
    (select m.join_code from public.mesa m where m.id = mesa_id),
    current_pin()
  ));

drop policy if exists "match_insert_with_pin" on public.match;
create policy "match_insert_with_pin" on public.match
  for insert with check (secret(
    (select m.join_code from public.mesa m where m.id = mesa_id),
    current_pin()
  ));

drop policy if exists "match_update_with_pin" on public.match;
create policy "match_update_with_pin" on public.match
  for update using (secret(
    (select m.join_code from public.mesa m where m.id = mesa_id),
    current_pin()
  ))
  with check (secret(
    (select m.join_code from public.mesa m where m.id = mesa_id),
    current_pin()
  ));

drop policy if exists "match_event_read_with_pin" on public.match_event;
create policy "match_event_read_with_pin" on public.match_event
  for select using (secret(
    (select m.join_code from public.mesa m join public.match mt on mt.mesa_id = m.id where mt.id = match_id),
    current_pin()
  ));

drop policy if exists "match_event_insert_with_pin" on public.match_event;
create policy "match_event_insert_with_pin" on public.match_event
  for insert with check (secret(
    (select m.join_code from public.mesa m join public.match mt on mt.mesa_id = m.id where mt.id = match_id),
    current_pin()
  ));

drop policy if exists "match_event_delete_with_pin" on public.match_event;
create policy "match_event_delete_with_pin" on public.match_event
  for delete using (secret(
    (select m.join_code from public.mesa m join public.match mt on mt.mesa_id = m.id where mt.id = match_id),
    current_pin()
  ));