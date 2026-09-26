import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '@/theme';
import { BackButton } from '@/components/ui';
import { getMatches } from '@/lib/mesa';
import { getMesa } from '@/lib/storage';
import type { Match, Mesa } from '@/types/database';

export default function HistorialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    getMesa(id).then(setMesa);
    getMatches(id).then(setMatches);
  }, [id]);

  const dateOf = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton />
      <Text style={styles.title}>Historial</Text>
      {mesa ? <Text style={styles.mesaName}>{mesa.name}</Text> : null}

      {matches.length === 0 ? (
        <Text style={styles.empty}>Todavía no hay partidas guardadas.</Text>
      ) : (
        matches.map((m, index) => (
          <View key={m.id} style={styles.card}>
            <Text style={styles.cardNumber}>Partido #{matches.length - index}</Text>
            <Text style={styles.cardResult}>
              {m.team_a_players.join(' / ')}{' '}
              <Text style={styles.score}>
                {m.team_a_score} - {m.team_b_score}
              </Text>{' '}
              {m.team_b_players.join(' / ')}
            </Text>
            <Text style={styles.cardMeta}>
              {m.winner === 'team_a' ? 'Ganó el primer equipo' : m.winner === 'team_b' ? 'Ganó el segundo equipo' : 'Empate'} · Objetivo {m.target_points} · {dateOf(m.started_at)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 8 },
  mesaName: { color: colors.textMuted, marginBottom: 20 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardNumber: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  cardResult: { color: colors.text, fontSize: 15, fontWeight: '600' },
  score: { color: colors.primary, fontWeight: '900' },
  cardMeta: { color: colors.textMuted, fontSize: 13, marginTop: 8 },
});