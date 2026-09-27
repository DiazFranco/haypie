import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { colors } from '@/theme';
import { Button } from '@/components/ui';
import { readError, clearError, type CrashRecord } from '@/lib/reportError';

export default function HomeScreen() {
  const [crash, setCrash] = useState<CrashRecord | null>(null);

  useFocusEffect(
    useCallback(() => {
      void readError().then(setCrash);
    }, [])
  );

  const dismissCrash = () => {
    void clearError();
    setCrash(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {crash ? (
        <View style={styles.crashCard}>
          <View style={styles.crashHeader}>
            <Text style={styles.crashTitle}>Ocurrió un error (decime cuál es)</Text>
            <Pressable onPress={dismissCrash} hitSlop={8}>
              <Text style={styles.crashDismiss}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.crashMessage} numberOfLines={6}>
            {crash.message}
          </Text>
        </View>
      ) : null}
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
  crashCard: {
    backgroundColor: '#3A1D1D',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
  },
  crashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  crashTitle: { color: '#ffb4b4', fontWeight: '800', fontSize: 14 },
  crashDismiss: { color: '#ffb4b4', fontSize: 16, fontWeight: '700' },
  crashMessage: { color: '#ffd7d7', fontSize: 12 },
});