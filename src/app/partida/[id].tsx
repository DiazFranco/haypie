import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '@/theme';
import { Button, BackButton } from '@/components/ui';
import { getPlayers, finishMatch } from '@/lib/mesa';
import { getMesa } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getOpenMatch, createOpenMatch, getMatchEvents, insertMatchEvent, deleteLastEvent, broadcastMesa, subscribeMesa, isServerId, type ServerMatch } from '@/lib/sync';
import type { MatchEvent, Player, Mesa } from '@/types/database';

const SCORE_OPTIONS = [1, 2, 3, 4];
const TARGETS = [15, 30];

export default function PartidaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [target, setTarget] = useState(30);
  const [serverMatchId, setServerMatchId] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const eventsRef = useRef<MatchEvent[]>([]);
  const serverMatchIdRef = useRef<string | null>(null);
  const targetRef = useRef(30);
  const loadingRef = useRef(false);
  const spectatorRef = useRef(false);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const spectator = !!mesa?.spectator;

  const sync = () => {
    serverMatchIdRef.current = serverMatchId;
    targetRef.current = target;
    spectatorRef.current = spectator;
  };
  useEffect(sync, [serverMatchId, target, spectator]);

  const score = (team: 'team_a' | 'team_b') =>
    events.filter((e) => e.team === team).reduce((s, e) => s + e.points, 0);

  const teamA = score('team_a');
  const teamB = score('team_b');
  const winner = teamA >= target ? 'A' : teamB >= target ? 'B' : null;

  const getTeamIds = () => {
    const half = Math.ceil(players.length / 2);
    const teamA = players.slice(0, half).map((p) => p.id);
    const teamB = players.slice(half).map((p) => p.id);
    return { teamA, teamB };
  };

  const applyEvent = (e: MatchEvent) => {
    setEvents((prev) => [...prev, e]);
  };

  const applyLive = (server: ServerMatch) => {
    setTarget(server.target_points);
    setServerMatchId(server.id);
    setLive(true);
  };

  const ensureOpenMatch = async () => {
    if (!mesa || !isServerId(mesa.id)) return null;
    if (serverMatchIdRef.current) return serverMatchIdRef.current;
    if (loadingRef.current) return null;
    loadingRef.current = true;
    try {
      const open = await getOpenMatch(mesa.id);
      if (open) {
        eventsRef.current = await getMatchEvents(open.id);
        setEvents(eventsRef.current);
        applyLive(open);
        return open.id;
      }
      if (spectatorRef.current) return null;
      const { teamA, teamB } = getTeamIds();
      if (teamA.length === 0) return null;
      const created = await createOpenMatch(mesa.id, mesa.pin, {
        targetPoints: targetRef.current,
        teamAPlayers: teamA,
        teamBPlayers: teamB,
      });
      if (created) {
        setServerMatchId(created.id);
        broadcastMesa(mesa.id, { type: 'match_started', matchId: created.id });
        return created.id;
      }
      return null;
    } catch {
      return null;
    } finally {
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    getMesa(id).then(setMesa);
    getPlayers(id).then(setPlayers);
  }, [id]);

  useEffect(() => {
    if (!mesa || !isServerId(mesa.id) || players.length === 0) return;
    void ensureOpenMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesa, players.length]);

  useEffect(() => {
    if (!mesa || !isServerId(mesa.id)) return;
    const onEvent: Parameters<typeof subscribeMesa>[1] = (e) => {
      if (e.type === 'match_event' && e.team) {
        applyEvent({ team: e.team, points: e.points ?? 0, created_at: new Date().toISOString() });
      } else if (e.type === 'undo') {
        setEvents((prev) => prev.slice(0, -1));
      }
    };
    const unsubscribe = subscribeMesa(mesa.id, onEvent);
    void ensureOpenMatch();
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesa]);

  const addPoints = async (team: 'team_a' | 'team_b', points: number) => {
    if (winner || spectator) return;
    const event: MatchEvent = { team, points, created_at: new Date().toISOString() };
    applyEvent(event);

    if (mesa && isServerId(mesa.id) && isSupabaseConfigured) {
      const matchId = await ensureOpenMatch();
      if (matchId) {
        await insertMatchEvent(mesa.id, mesa.pin, { matchId, team, points });
        broadcastMesa(mesa.id, { type: 'match_event', matchId, team, points });
      }
    }
  };

  const undo = async () => {
    if (events.length === 0 || spectator) return;
    setEvents((prev) => prev.slice(0, -1));
    if (mesa && isServerId(mesa.id) && isSupabaseConfigured && serverMatchIdRef.current) {
      await deleteLastEvent(mesa.id, mesa.pin, serverMatchIdRef.current);
      broadcastMesa(mesa.id, { type: 'undo', matchId: serverMatchIdRef.current });
    }
  };

  const handleFinish = async () => {
    if (spectator) return;
    const half = Math.ceil(players.length / 2);
    const teamAPlayers = players.slice(0, half).map((p) => p.name);
    const teamBPlayers = players.slice(half).map((p) => p.name);
    await finishMatch(id, {
      targetPoints: target,
      teamAPlayers,
      teamBPlayers,
      teamAScore: teamA,
      teamBScore: teamB,
      events,
      serverMatchId: serverMatchIdRef.current ?? undefined,
    });
    router.back();
  };

  const canUndo = events.length > 0 && !winner;

  return (
    <View style={styles.container}>
      <BackButton />
      {live ? <Text style={styles.liveBadge}>{spectator ? '● EN VIVO · SOLO LECTURA' : '● EN VIVO'}</Text> : null}
      <View style={styles.matchup}>
        <View style={styles.matchupTeam}>
          <Text style={styles.matchupLabel}>EQUIPO A</Text>
          <Text style={styles.matchupNames}>{players.slice(0, Math.ceil(players.length / 2)).map((p) => p.name).join('\n')}</Text>
        </View>
        <Text style={styles.matchupVs}>VS</Text>
        <View style={styles.matchupTeam}>
          <Text style={styles.matchupLabel}>EQUIPO B</Text>
          <Text style={styles.matchupNames}>{players.slice(Math.ceil(players.length / 2)).map((p) => p.name).join('\n')}</Text>
        </View>
      </View>

      {!spectator ? (
        <View style={styles.targetRow}>
          {TARGETS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTarget(t)}
              style={[styles.targetBtn, target === t && styles.targetBtnActive]}
            >
              <Text style={[styles.targetText, target === t && styles.targetTextActive]}>
                {t} pts
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {winner && !spectator ? (
        <View style={styles.winnerBanner}>
          <Text style={styles.winnerText}>🏆 ¡Ganó el equipo {winner}!</Text>
          <Button title="Guardar partida" onPress={handleFinish} />
        </View>
      ) : null}

      <View style={styles.scoreboard}>
        <View style={styles.team}>
          <Text style={styles.teamLabel}>EQUIPO A</Text>
          <Text style={styles.score}>{teamA}</Text>
        </View>
        <View style={styles.team}>
          <Text style={styles.teamLabel}>EQUIPO B</Text>
          <Text style={styles.score}>{teamB}</Text>
        </View>
      </View>

      {spectator ? (
        <Text style={styles.spectatorHint}>Modo espectador: podés ver el marcador, no sumar puntos.</Text>
      ) : (
        <View>
          <View style={styles.padRow}>
            {SCORE_OPTIONS.map((points) => (
              <View key={points} style={styles.padCol}>
                <Button title={`+${points}`} onPress={() => addPoints('team_a', points)} />
                <Button title={`+${points}`} variant="ghost" onPress={() => addPoints('team_b', points)} />
              </View>
            ))}
          </View>

          <Button title="↩ Deshacer" variant="ghost" onPress={undo} disabled={!canUndo} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  liveBadge: {
    color: colors.positive,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  matchup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  matchupTeam: { flex: 1, alignItems: 'center' },
  matchupLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  matchupNames: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  matchupVs: { color: colors.primary, fontWeight: '900', fontSize: 18, marginHorizontal: 12 },
  targetRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  targetBtn: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  targetBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  targetText: { color: colors.text, fontWeight: '700' },
  targetTextActive: { color: colors.primaryText },
  winnerBanner: { backgroundColor: colors.primary, borderRadius: 10, padding: 12, marginBottom: 12, gap: 10 },
  winnerText: { color: colors.primaryText, fontWeight: '800', textAlign: 'center' },
  scoreboard: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 32 },
  team: { alignItems: 'center' },
  teamLabel: { color: colors.textMuted, fontWeight: '700' },
  score: { color: colors.text, fontSize: 72, fontWeight: '900' },
  padRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 24 },
  padCol: { flex: 1, gap: 10 },
  spectatorHint: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 'auto',
  },
});