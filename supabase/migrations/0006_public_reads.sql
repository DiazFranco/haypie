-- Espectadores: con el código se puede VER (lecturas públicas),
-- solo con el PIN se puede CARGAR/CAMBIAR la partida (escrituras).
-- verify_pin() permite validar un PIN contra la mesa sin exponer datos.

drop policy if exists "player_read_with_pin" on public.player;
create policy "player_read_public" on public.player
  for select using (true);

drop policy if exists "match_read_with_pin" on public.match;
create policy "match_read_public" on public.match
  for select using (true);

drop policy if exists "match_event_read_with_pin" on public.match_event;
create policy "match_event_read_public" on public.match_event
  for select using (true);

create or replace function public.verify_pin(p_join_code text, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return exists (
    select 1
    from public.mesa m
    where m.join_code = p_join_code
      and m.pin_hash = crypt(p_pin, m.pin_hash)
  );
end;
$$;

grant execute on function public.verify_pin(text, text) to anon;