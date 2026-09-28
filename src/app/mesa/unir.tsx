import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme';
import { Button, Input, BackButton, FormScrollView } from '@/components/ui';
import { joinMesaByCode } from '@/lib/mesa';

export default function JoinMesaScreen() {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setError(null);
    if (!code.trim()) {
      setError('Ingresá el código de la mesa.');
      return;
    }
    setLoading(true);
    try {
      const mesa = await joinMesaByCode(code.trim(), pin);
      router.replace(`/mesa/${mesa.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se encontró la mesa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScrollView contentContainerStyle={styles.container}>
      <BackButton />
      <Input
        autoFocus
        label="Código de la mesa"
        value={code}
        onChangeText={setCode}
        placeholder="TRUCO-8K4P"
      />
      <Input
        label="PIN (opcional)"
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
      />
      <Text style={styles.hint}>
        Sin PIN te unís como espectador: vas a poder ver la partida en vivo. Con el PIN además podés sumar puntos.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={loading ? 'Buscando…' : 'Unirse'} onPress={handleJoin} disabled={loading} />
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
  error: { color: colors.danger, marginBottom: 12, textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 13, marginBottom: 16 },
});