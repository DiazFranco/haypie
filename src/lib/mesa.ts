import { getMesas, getMesa, saveMesa, saveMatch, getMatches as getMatchesLocal, newId } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { pushMesa, fetchMesaByCode, isServerId, finishMesaMatch, broadcastMesa } from '@/lib/sync';
import type { Mesa, Player, Match, MatchEvent } from '@/types/database';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

const randomCodeString = () => {
  const chars = new Uint8Array(CODE_LENGTH);
  const crypto = globalThis.crypto;
  if (crypto?.getRandomValues) {
    crypto.getRandomValues(chars);
  } else {
    for (let i = 0; i < CODE_LENGTH; i++) {
      chars[i] = Math.floor(Math.random() * 256);
    }
  }
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[chars[i] % CODE_ALPHABET.length];
  }
  return code;
};

const generateJoinCode = async () => {
  const mesas = await getMesas();
  const existing = new Set(mesas.map((m) => m.join_code.toLowerCase()));
  let code = randomCodeString();
  while (existing.has(code.toLowerCase())) {
    code = randomCodeString();
  }
  return `TRUCO-${code}`;
};

export async function createMesa(name: string, playerNames: string[], pin: string): Promise<Mesa> {
  const players: Player[] = playerNames.map((name) => ({ id: newId(), name }));
  const mesa: Mesa = {
    id: newId(),
    name,
    join_code: await generateJoinCode(),
    pin,
    players,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const pushed = await pushMesa(mesa);
    if (pushed) {
      mesa.id = String(pushed.mesa.id);
      mesa.players = pushed.players;
    }
  }

  await saveMesa(mesa);
  return mesa;
}

export async function joinMesaByCode(code: string, pin: string): Promise<Mesa> {
  const mesas = await getMesas();
  const local = mesas.find((m) => m.join_code.toLowerCase() === code.trim().toLowerCase());
  if (local) {
    if (local.pin !== pin) throw new Error('PIN incorrecto.');
    return local;
  }

  if (isSupabaseConfigured) {
    const fetched = await fetchMesaByCode(code.trim(), pin);
    if (fetched) {
      const mesa: Mesa = {
        id: fetched.mesa.id,
        name: fetched.mesa.name,
        join_code: fetched.mesa.join_code,
        pin,
        players: fetched.players,
        created_at: new Date().toISOString(),
      };
      await saveMesa(mesa);
      return mesa;
    }
    throw new Error('No se encontró la mesa con ese código o el PIN no coincide.');
  }

  throw new Error('No se encontró la mesa con ese código.');
}

export async function getPlayers(mesaId: string): Promise<Player[]> {
  const mesa = await getMesa(mesaId);
  return mesa?.players ?? [];
}

export async function getMesaById(mesaId: string) {
  return getMesa(mesaId);
}

export async function getMatches(mesaId: string) {
  const matches = await getMatchesLocal(mesaId);
  return matches.sort((a, b) => b.started_at.localeCompare(a.started_at));
}

export async function finishMatch(
  mesaId: string,
  input: {
    targetPoints: number;
    teamAPlayers: string[];
    teamBPlayers: string[];
    teamAScore: number;
    teamBScore: number;
    events: MatchEvent[];
    serverMatchId?: string;
  }
): Promise<Match> {
  const winner: Match['winner'] =
    input.teamAScore > input.teamBScore
      ? 'team_a'
      : input.teamBScore > input.teamAScore
        ? 'team_b'
        : 'draw';

  const mesa = await getMesa(mesaId);
  const match: Match = {
    id: mesa && isServerId(mesa.id) && input.serverMatchId ? input.serverMatchId : newId(),
    mesa_id: mesaId,
    target_points: input.targetPoints,
    team_a_players: input.teamAPlayers,
    team_b_players: input.teamBPlayers,
    team_a_score: input.teamAScore,
    team_b_score: input.teamBScore,
    winner,
    started_at: input.events[0]?.created_at ?? new Date().toISOString(),
    finished_at: new Date().toISOString(),
  };

  if (mesa && isServerId(mesa.id) && input.serverMatchId) {
    await finishMesaMatch(mesaId, mesa.pin, {
      matchId: input.serverMatchId,
      winner,
      teamAScore: input.teamAScore,
      teamBScore: input.teamBScore,
    });
    broadcastMesa(mesaId, { type: 'match_finished', matchId: input.serverMatchId });
  }

  await saveMatch(mesaId, match);
  return match;
}