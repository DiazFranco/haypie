-- Hay Pie Truco — schema inicial (MVP)
-- Modelo: Mesa -> Player -> Match -> MatchEvent
-- Acceso sin cuenta: código de mesa + PIN (header request.pin).

create extension if not exists "pgcrypto";

create or replace function secret(code text, pin text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from mesa m
    where m.join_code = secret.code
      and m.pin_hash = crypt(secret.pin, m.pin_hash)
  );
end;
$$;

-- PostgREST expone todos los headers del request en el GUC JSON
-- `request.headers` (claves en minúscula y con el nombre completo
-- del header, ej. `request.pin`).
create or replace function current_pin()
returns text
language sql
immutable
as $$
  select coalesce(current_setting('request.headers', true)::jsonb ->> 'request.pin', '')
$$;

grant execute on function secret(text, text) to anon;

create table public.mesa (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique
    check (length(join_code) between 4 and 20),
  pin_hash text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.player (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesa (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (mesa_id, name)
);

create table public.match (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesa (id) on delete cascade,
  target_points int not null default 30 check (target_points in (15, 30)),
  team_a_players uuid[] not null,
  team_b_players uuid[] not null,
  team_a_score int not null default 0 check (team_a_score >= 0),
  team_b_score int not null default 0 check (team_b_score >= 0),
  winner text check (winner in ('team_a', 'team_b', 'draw')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  recorded_by uuid references public.player (id)
);

create index match_mesa_id_idx on public.match (mesa_id);
create index match_started_at_idx on public.match (started_at desc);
create index match_open_idx on public.match (mesa_id) where finished_at is null;

create table public.match_event (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.match (id) on delete cascade,
  team text not null check (team in ('team_a', 'team_b')),
  points int not null check (points > 0),
  player_id uuid references public.player (id),
  created_at timestamptz not null default now()
);

create index match_event_match_id_idx on public.match_event (match_id);
create index match_event_match_created_idx on public.match_event (match_id, created_at);

-- Creación de mesa en una sola llamada (hashea el PIN server-side y
-- devuelve mesa + jugadores con sus ids de servidor).
create or replace function public.create_mesa_with_pin(
  p_name text,
  p_players text[],
  p_pin text,
  p_join_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mesa public.mesa;
  v_player public.player;
  v_players jsonb := '[]'::jsonb;
begin
  insert into public.mesa (name, join_code, pin_hash, settings)
  values (p_name, p_join_code, crypt(p_pin, gen_salt('bf')), '{}'::jsonb)
  returning * into v_mesa;

  if p_players is not null then
    foreach v_player.name in array p_players loop
      insert into public.player (mesa_id, name) values (v_mesa.id, v_player.name)
      returning * into v_player;
      v_players := v_players || jsonb_build_object('id', v_player.id, 'name', v_player.name);
    end loop;
  end if;

  return jsonb_build_object(
    'mesa', to_jsonb(v_mesa),
    'players', v_players
  );
end;
$$;

grant execute on function public.create_mesa_with_pin(text, text[], text, text) to anon;

alter table public.mesa enable row level security;
alter table public.player enable row level security;
alter table public.match enable row level security;
alter table public.match_event enable row level security;

grant select on public.mesa to anon;
grant insert, select on public.player to anon;
grant insert, select, update, delete on public.match to anon;
grant insert, select, delete on public.match_event to anon;

-- Sin cuentas personales: la "autenticación" es código de mesa + PIN.
-- Toda operación (excepto SELECT de mesa por código) exige el PIN correcto
-- vía header `request.pin` (PostgREST lo expone en el GUC `request.headers`).
create policy "mesa_select_by_code" on public.mesa
  for select using (true);

create policy "mesa_insert_with_pin" on public.mesa
  for insert with check (secret(join_code, current_pin()));

create policy "player_read_with_pin" on public.player
  for select using (secret(
    (select m.join_code from public.mesa m where m.id = mesa_id),
    current_pin()
  ));

create policy "player_write_with_pin" on public.player
  for insert with check (secret(
    (select m.join_code from public.mesa m where m.id = mesa_id),
    current_pin()
  ));

create policy "match_read_with_pin" on public.match
  for select using (secret(
    (select m.join_code from public.mesa m where m.id = mesa_id),
    current_pin()
  ));

create policy "match_insert_with_pin" on public.match
  for insert with check (secret(
    (select m.join_code from public.mesa m where m.id = mesa_id),
    current_pin()
  ));

create policy "match_update_with_pin" on public.match
  for update using (secret(
    (select m.join_code from public.mesa m where m.id = mesa_id),
    current_pin()
  ))
  with check (secret(
    (select m.join_code from public.mesa m where m.id = mesa_id),
    current_pin()
  ));

create policy "match_event_read_with_pin" on public.match_event
  for select using (secret(
    (select m.join_code from public.mesa m join public.match mt on mt.mesa_id = m.id where mt.id = match_id),
    current_pin()
  ));

create policy "match_event_insert_with_pin" on public.match_event
  for insert with check (secret(
    (select m.join_code from public.mesa m join public.match mt on mt.mesa_id = m.id where mt.id = match_id),
    current_pin()
  ));

create policy "match_event_delete_with_pin" on public.match_event
  for delete using (secret(
    (select m.join_code from public.mesa m join public.match mt on mt.mesa_id = m.id where mt.id = match_id),
    current_pin()
  ));