import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme';
import { Button, Input, BackButton } from '@/components/ui';
import { createMesa } from '@/lib/mesa';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;

export default function CreateMesaScreen() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [players, setPlayers] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const teamSplit = Math.ceil(players.length / 2);
  const teamA = players.slice(0, teamSplit);
  const teamB = players.slice(teamSplit);

  const updatePlayer = (index: number, value: string) => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? value : p)));
  };

  const addPlayer = () => {
    if (players.length >= MAX_PLAYERS) return;
    setPlayers((prev) => [...prev, '']);
  };

  const removePlayer = (index: number) => {
    if (players.length <= MIN_PLAYERS) return;
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const renderPlayer = (player: string, index: number) => (
    <View key={index} style={styles.playerRow}>
      <View style={styles.playerInput}>
        <Input
          value={player}
          onChangeText={(t) => updatePlayer(index, t)}
          placeholder={`Jugador ${index + 1}`}
        />
      </View>
      {players.length > MIN_PLAYERS ? (
        <Pressable onPress={() => removePlayer(index)} style={styles.removeBtn}>
          <Text style={styles.removeText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const handleCreate = async () => {
    setError(null);
    const names = players.map((p) => p.trim()).filter(Boolean);

    if (!name.trim()) {
      setError('Ingresá un nombre para la mesa.');
      return;
    }
    if (pin.length < 4) {
      setError('Ingresá un PIN de 4 dígitos.');
      return;
    }
    if (names.length < MIN_PLAYERS) {
      setError(`Se necesitan al menos ${MIN_PLAYERS} jugadores.`);
      return;
    }

    setLoading(true);
    try {
      const mesa = await createMesa(name.trim(), names, pin);
      router.replace(`/mesa/${mesa.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la mesa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton />
      <Input label="Nombre de la mesa" value={name} onChangeText={setName} placeholder="Los Jueves" />
      <Input
        label="PIN (4 dígitos)"
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
      />

      <Text style={styles.sectionTitle}>
        Jugadores ({players.length}/{MAX_PLAYERS})
      </Text>

      <Text style={styles.teamTitle}>EQUIPO A</Text>
      {teamA.map((player, index) => renderPlayer(player, index))}

      <View style={styles.vsRow}>
        <View style={styles.vsLine} />
        <Text style={styles.vsText}>VS</Text>
        <View style={styles.vsLine} />
      </View>

      <Text style={styles.teamTitle}>EQUIPO B</Text>
      {teamB.map((player, index) => renderPlayer(player, teamSplit + index))}

      {players.length < MAX_PLAYERS ? (
        <Button title="+ Agregar jugador" variant="ghost" onPress={addPlayer} />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={loading ? 'Creando…' : 'Crear mesa'} onPress={handleCreate} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 16,
  },
  teamTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  playerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  playerInput: { flex: 1 },
  removeBtn: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 14,
    marginBottom: 16,
  },
  removeText: { color: colors.danger, fontSize: 16, fontWeight: '700' },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  vsLine: { flex: 1, height: 1, backgroundColor: colors.border },
  vsText: { color: colors.primary, fontWeight: '900', letterSpacing: 2 },
  error: { color: colors.danger, marginTop: 16, marginBottom: 12, textAlign: 'center' },
});