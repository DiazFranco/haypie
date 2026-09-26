import { supabase, clientForPin, isSupabaseConfigured } from '@/lib/supabase';
import type { Mesa, MatchEvent } from '@/types/database';

export type LiveEvent = {
  type: 'match_event' | 'match_started' | 'match_finished' | 'undo';
  matchId: string;
  team?: 'team_a' | 'team_b';
  points?: number;
};

type ServerPlayer = { id: string; name: string };
export type ServerMesaResult = { mesa: Record<string, unknown>; players: ServerPlayer[] };
export type ServerMatch = {
  id: string;
  mesa_id: string;
  target_points: number;
  team_a_players: string[];
  team_b_players: string[];
  team_a_score: number;
  team_b_score: number;
  winner: 'team_a' | 'team_b' | 'draw' | null;
  started_at: string;
  finished_at: string | null;
};

const channelName = (mesaId: string) => `mesa-${mesaId}`;

export function subscribeMesa(mesaId: string, onEvent: (e: LiveEvent) => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel(channelName(mesaId))
    .on('broadcast', { event: 'live' }, (payload) => onEvent(payload.payload as LiveEvent))
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function broadcastMesa(mesaId: string, event: LiveEvent) {
  if (!isSupabaseConfigured) return;
  let channel = supabase.getChannels().find((c) => c.topic === `realtime:${channelName(mesaId)}`);
  if (!channel) {
    channel = supabase.channel(channelName(mesaId));
    channel.subscribe();
  }
  channel.send({ type: 'broadcast', event: 'live', payload: event });
}

// ---- Mesa ----

export async function pushMesa(
  mesa: Mesa
): Promise<{ mesa: Record<string, unknown>; players: ServerPlayer[] } | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await clientForPin(mesa.pin).rpc('create_mesa_with_pin', {
      p_name: mesa.name,
      p_players: mesa.players.map((p) => p.name),
      p_pin: mesa.pin,
      p_join_code: mesa.join_code,
    });
    if (error) throw error;
    const result = data as ServerMesaResult;
    return { mesa: result.mesa, players: result.players };
  } catch {
    return null;
  }
}

export async function fetchMesaByCode(code: string) {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase
    .from('mesa')
    .select('id, name, join_code')
    .eq('join_code', code)
    .single();
  if (!data) return null;

  const players = await fetchPlayers(String(data.id));
  return { mesa: data as { id: string; name: string; join_code: string }, players };
}

export async function verifyPin(code: string, pin: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { data, error } = await supabase.rpc('verify_pin', {
    p_join_code: code,
    p_pin: pin,
  });
  return !error && data === true;
}

export async function fetchPlayers(mesaId: string): Promise<ServerPlayer[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from('player')
    .select('id, name')
    .eq('mesa_id', mesaId);
  return (data ?? []) as ServerPlayer[];
}

// ---- Partida ----

export async function getOpenMatch(mesaId: string): Promise<ServerMatch | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase
    .from('match')
    .select('*')
    .eq('mesa_id', mesaId)
    .is('finished_at', null)
    .limit(1)
    .maybeSingle();
  return (data as ServerMatch | null) ?? null;
}

export async function getServerMatches(mesaId: string): Promise<ServerMatch[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from('match')
    .select('*')
    .eq('mesa_id', mesaId)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false });
  return (data ?? []) as ServerMatch[];
}

export async function createOpenMatch(mesaId: string, pin: string, input: {
  targetPoints: number;
  teamAPlayers: string[];
  teamBPlayers: string[];
}): Promise<ServerMatch | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await clientForPin(pin)
    .from('match')
    .insert({
      mesa_id: mesaId,
      target_points: input.targetPoints,
      team_a_players: input.teamAPlayers,
      team_b_players: input.teamBPlayers,
      winner: null,
    })
    .select()
    .single();
  if (error) return null;
  return data as ServerMatch;
}

export async function getMatchEvents(matchId: string): Promise<MatchEvent[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from('match_event')
    .select('team, points, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });
  return (data ?? []) as MatchEvent[];
}

export async function insertMatchEvent(mesaId: string, pin: string, event: {
  matchId: string;
  team: 'team_a' | 'team_b';
  points: number;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await clientForPin(pin)
      .from('match_event')
      .insert({
        match_id: event.matchId,
        team: event.team,
        points: event.points,
      });
  } catch {
    // best-effort: sin conexión no se replica en vivo
  }
}

export async function deleteLastEvent(mesaId: string, pin: string, matchId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { data } = await clientForPin(pin)
      .from('match_event')
      .select('id')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(1);
    const last = data?.[0];
    if (last) {
      await clientForPin(pin).from('match_event').delete().eq('id', last.id);
    }
  } catch {
    // best-effort
  }
}

export async function finishMesaMatch(mesaId: string, pin: string, server: {
  matchId: string;
  winner: 'team_a' | 'team_b' | 'draw';
  teamAScore: number;
  teamBScore: number;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await clientForPin(pin)
      .from('match')
      .update({
        winner: server.winner,
        team_a_score: server.teamAScore,
        team_b_score: server.teamBScore,
        finished_at: new Date().toISOString(),
      })
      .eq('id', server.matchId);
  } catch {
    // best-effort
  }
}

export function isServerId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}