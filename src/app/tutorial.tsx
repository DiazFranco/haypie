import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme';
import { Button } from '@/components/ui';
import { markTutorialSeen } from '@/lib/tutorial';

const STEPS = [
  {
    emoji: '🃏',
    title: 'Armá tu mesa',
    body: 'Creá una mesa con los nombres de los jugadores y un PIN de 4 dígitos. El PIN es lo que separa a quien juega de quien mira.',
  },
  {
    emoji: '🔑',
    title: 'Compartí el código',
    body: 'Cada mesa tiene un código, por ejemplo TRUCO-8K4P. Pasáselo a los demás y la pueden abrir desde la pantalla de inicio, sin instalar nada.',
  },
  {
    emoji: '👀',
    title: 'Invitados o espejo',
    body: 'Sin PIN se unen como espectadores: ven el marcador en vivo pero no pueden sumar. Con PIN suman puntos, eligen el objetivo y guardan la partida.',
  },
  {
    emoji: '➕',
    title: 'Sumá puntos',
    body: 'Elegí el objetivo (15 o 30) y sumá de a 1, 2, 3 o 4 para cada equipo. Si te pasás, tocá ↩ Deshacer y corregís sin romper el ritmo.',
  },
  {
    emoji: '🏆',
    title: 'Guardá y revisá',
    body: 'Cuando un equipo llega al objetivo, tocá Guardar partida. Queda en el historial con los nombres, el resultado y la fecha, y podés ver estadísticas de cada mesa.',
  },
];

export default function TutorialScreen() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Se marca al abrirlo (haya entered por el auto-redirect o desde el home) para que
  // el tutorial no vuelva a interceptar la navegación si el usuario sale con atrás.
  useEffect(() => {
    void markTutorialSeen();
  }, []);

  const close = () => {
    router.replace('/');
  };

  const next = () => {
    if (isLast) close();
    else setStep((s) => s + 1);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={close}
        hitSlop={12}
        style={styles.skip}
      >
        <Text style={styles.skipText}>Saltar</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.text}>{current.body}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View key={s.title} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <Button title={isLast ? '¡Listo!' : 'Siguiente'} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skip: { alignSelf: 'flex-end', padding: 16, marginTop: 8 },
  skipText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  body: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 24 },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: 20 },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  text: { color: colors.textMuted, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  footer: { padding: 24, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 20 },
});