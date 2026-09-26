import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '@/theme';
import { BackButton } from '@/components/ui';
import { getMatches, getPlayers } from '@/lib/mesa';
import type { Match, Player } from '@/types/database';

export default function EstadisticasScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    getMatches(id).then(setMatches);
    getPlayers(id).then(setPlayers);
  }, [id]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton />
      <Text style={styles.title}>Estadísticas</Text>

      <Text style={styles.empty}>{matches.length} partidos registrados</Text>

      <Text style={styles.section}>Ranking por jugador</Text>
      {players.map((p) => {
        const aWins = matches.filter(
          (m) => m.team_a_players.includes(p.name) && m.winner === 'team_a'
        ).length;
        const bWins = matches.filter(
          (m) => m.team_b_players.includes(p.name) && m.winner === 'team_b'
        ).length;
        const wins = aWins + bWins;
        const total = matches.filter(
          (m) => m.team_a_players.includes(p.name) || m.team_b_players.includes(p.name)
        ).length;
        const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;
        return (
          <View key={p.id} style={styles.row}>
            <Text style={styles.rowName}>{p.name}</Text>
            <Text style={styles.rowStat}>
              {wins}V / {Math.max(0, total - wins)}D · {winrate}%
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 8, marginBottom: 8 },
  empty: { color: colors.textMuted, marginBottom: 24 },
  section: { color: colors.primary, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  rowName: { color: colors.text, fontWeight: '600' },
  rowStat: { color: colors.textMuted },
});