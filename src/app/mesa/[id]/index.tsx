import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, Link, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { Button, BackButton } from '@/components/ui';
import { getPlayers } from '@/lib/mesa';
import { getMesa } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getOpenMatch, getMatchEvents, subscribeMesa, isServerId, type LiveEvent } from '@/lib/sync';
import type { Mesa, Player, MatchEvent } from '@/types/database';

export default function MesaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null);
  const [liveTeams, setLiveTeams] = useState<{ a: string[]; b: string[] }>({ a: [], b: [] });
  const [liveEvents, setLiveEvents] = useState<MatchEvent[]>([]);

  const loadOpenMatch = useCallback(() => {
    if (!mesa || !isServerId(mesa.id)) return;
    getOpenMatch(mesa.id).then((open) => {
      if (open) {
        setLiveMatchId(open.id);
        setLiveTeams({ a: open.team_a_players, b: open.team_b_players });
        getMatchEvents(open.id).then(setLiveEvents);
      } else {
        setLiveMatchId(null);
        setLiveTeams({ a: [], b: [] });
        setLiveEvents([]);
      }
    });
  }, [mesa]);

  useEffect(() => {
    getMesa(id).then(setMesa);
    getPlayers(id).then(setPlayers);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadOpenMatch();
    }, [loadOpenMatch])
  );

  useEffect(() => {
    if (!mesa || !isServerId(mesa.id) || !isSupabaseConfigured) return;
    const onEvent = (e: LiveEvent) => {
      if (e.type === 'match_started') {
        loadOpenMatch();
      } else if (e.type === 'match_event') {
        setLiveEvents((prev) => [
          ...prev,
          { team: e.team ?? 'team_a', points: e.points ?? 0, created_at: new Date().toISOString() },
        ]);
      } else if (e.type === 'match_finished') {
        setLiveMatchId(null);
        setLiveTeams({ a: [], b: [] });
        setLiveEvents([]);
      } else if (e.type === 'undo') {
        setLiveEvents((prev) => prev.slice(0, -1));
      }
    };
    const unsubscribe = subscribeMesa(mesa.id, onEvent);
    return unsubscribe;
  }, [mesa, loadOpenMatch]);

  const copyCode = async () => {
    if (!mesa) return;
    await Clipboard.setStringAsync(mesa.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreOf = (team: 'team_a' | 'team_b') =>
    liveEvents.filter((e) => e.team === team).reduce((s, e) => s + e.points, 0);
  const liveA = scoreOf('team_a');
  const liveB = scoreOf('team_b');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton />

      <Text style={styles.name}>{mesa?.name}</Text>
      {mesa ? (
        <View style={styles.codeRow}>
          <Text style={styles.code}>Código {mesa.join_code}</Text>
          <Pressable onPress={copyCode} style={({ pressed }) => [styles.copyBtn, pressed && styles.copyPressed]}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={copied ? colors.positive : colors.primary} />
          </Pressable>
        </View>
      ) : null}
      {mesa ? <Text style={styles.pin}>PIN {mesa.pin}</Text> : null}

      {mesa?.spectator ? (
        <Text style={styles.spectatorBadge}>Modo espectador: solo lectura</Text>
      ) : null}

      {liveMatchId ? (
        <Link href={`/partida/${id}`} asChild>
          <Pressable style={({ pressed }) => [styles.liveCard, pressed && styles.liveCardPressed]}>
            <View style={styles.liveHeader}>
              <Text style={styles.liveBadge}>● PARTIDA EN VIVO</Text>
              <Text style={styles.liveArrow}>Ver ›</Text>
            </View>
            <View style={styles.liveMatchup}>
              <Text style={styles.liveTeam}>{liveTeams.a.map((playerId) => players.find((p) => p.id === playerId)?.name ?? playerId).join(' / ')}</Text>
              <Text style={styles.liveScore}>{liveA}</Text>
            </View>
            <View style={styles.liveMatchup}>
              <Text style={styles.liveTeam}>{liveTeams.b.map((playerId) => players.find((p) => p.id === playerId)?.name ?? playerId).join(' / ')}</Text>
              <Text style={styles.liveScore}>{liveB}</Text>
            </View>
          </Pressable>
        </Link>
      ) : null}

      <View style={styles.playerList}>
        {players.map((p) => (
          <Text key={p.id} style={styles.player}>
            🂡 {p.name}
          </Text>
        ))}
      </View>

      <View style={styles.actions}>
        {!mesa?.spectator ? (
          <Link href={`/partida/${id}`} asChild>
            <Button title="Empezar partida" onPress={() => {}} disabled={players.length < 2} />
          </Link>
        ) : null}
        <Link href={`/mesa/${id}/historial`} asChild>
          <Button title="Historial" variant="ghost" onPress={() => {}} />
        </Link>
        <Link href={`/mesa/${id}/estadisticas`} asChild>
          <Button title="Estadísticas" variant="ghost" onPress={() => {}} />
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
  name: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
    marginTop: 4,
  },
  code: { color: colors.textMuted, flexShrink: 1 },
  pin: { color: colors.textMuted, marginBottom: 32 },
  copyBtn: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 6,
  },
  copyPressed: { opacity: 0.7 },
  spectatorBadge: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 24,
  },
  liveCard: {
    backgroundColor: colors.surface,
    borderColor: colors.positive,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  liveCardPressed: { opacity: 0.8 },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveBadge: { color: colors.positive, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  liveArrow: { color: colors.primary, fontWeight: '700' },
  liveMatchup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  liveTeam: { color: colors.text, fontWeight: '600', flexShrink: 1 },
  liveScore: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  playerList: { gap: 10, marginBottom: 32 },
  player: { color: colors.text, fontSize: 16 },
  actions: { gap: 12 },
});