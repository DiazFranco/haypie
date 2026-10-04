import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { colors } from '@/theme';

export function FooterLinks() {
  return (
    <View style={styles.row}>
      <Link href="/tutorial" asChild>
        <Pressable style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
          <Text style={styles.text}>Cómo usar la app</Text>
        </Pressable>
      </Link>
      <View style={styles.separator} />
      <Link href="/ayuda" asChild>
        <Pressable style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
          <Text style={styles.text}>Ayuda y contacto</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  item: { padding: 8 },
  separator: { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: 8 },
  pressed: { opacity: 0.7 },
  text: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});