import { Pressable, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { colors } from '@/theme';

export function AyudaLink() {
  return (
    <Link href="/ayuda" asChild>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <Text style={styles.text}>Ayuda y contacto</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', marginTop: 24, padding: 8 },
  pressed: { opacity: 0.7 },
  text: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});
