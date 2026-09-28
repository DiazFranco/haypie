import { StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import Constants from 'expo-constants';
import { colors } from '@/theme';
import { BackButton, FormScrollView } from '@/components/ui';

const SUPPORT_EMAIL = 'franco.gdiaz9@gmail.com';
const PRIVACY_URL =
  'https://raw.githubusercontent.com/DiazFranco/haypie/master/PRIVACY.md';

export default function AyudaScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <FormScrollView contentContainerStyle={styles.container}>
      <BackButton />
      <Text style={styles.title}>Ayuda</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Soporte</Text>
        <Text style={styles.body}>
          ¿Tenés un problema, una idea o querés que borremos una mesa? Escribinos y te
          respondemos a la brevedad.
        </Text>
        <Pressable
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          style={({ pressed }) => [styles.mailRow, pressed && styles.pressed]}
        >
          <Text style={styles.mail}>{SUPPORT_EMAIL}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cómo se juega</Text>
        <Text style={styles.body}>
          1. Creá la mesa con los nombres de los jugadores y un PIN de 4 dígitos.{'\n'}
          2. Pasale el código de la mesa a los demás.{'\n'}
          3. Elegí el objetivo (15 o 30 puntos) y sumá puntos de a 1, 2, 3 o 4 para cada
          equipo.{'\n'}
          4. Con el PIN, cualquiera puede sumar; sin el PIN, se une como espectador y sólo
          ve el marcador.{'\n'}
          5. Cuando alguien llega al objetivo, guardá la partida y queda en el historial.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sin señal</Text>
        <Text style={styles.body}>
          Si te quedás sin internet la app sigue funcionando: podés llevar el marcador y
          guardar las partidas en el teléfono.
        </Text>
      </View>

      <Pressable
        onPress={() => Linking.openURL(PRIVACY_URL)}
        style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
      >
        <Text style={styles.link}>Política de privacidad</Text>
      </Pressable>

      <Text style={styles.version}>Hay Pie Truco {version} · Hecho en Argentina 🇦🇷</Text>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 8, marginBottom: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  mailRow: { marginTop: 12 },
  mail: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  linkRow: { paddingVertical: 12 },
  link: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  version: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
