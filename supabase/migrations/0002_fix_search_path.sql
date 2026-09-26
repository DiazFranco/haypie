-- Fix: pgcrypto vive en el schema `extensions`; el search_path de la función
-- debe incluirlo para resolver crypt()/gen_salt().

create or replace function public.create_mesa_with_pin(
  p_name text,
  p_players text[],
  p_pin text,
  p_join_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
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