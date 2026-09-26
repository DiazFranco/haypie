import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { Link } from 'expo-router';
import { colors } from '@/theme';
import { Button } from '@/components/ui';

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('@/assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.tagline}>Porque cada partida cuenta</Text>

      <View style={styles.actions}>
        <Link href="/mesa/nueva" asChild>
          <Button title="Crear una mesa" onPress={() => {}} />
        </Link>
        <Link href="/mesa/unir" asChild>
          <Button title="Unirse con código" variant="ghost" onPress={() => {}} />
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    width: 240,
    height: 240,
    alignSelf: 'center',
  },
  tagline: { color: colors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  actions: { gap: 12 },
});