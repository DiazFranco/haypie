import AsyncStorage from '@react-native-async-storage/async-storage';

const CRASH_KEY = 'hay-pie-truco:crash';

export type CrashRecord = { at: string; message: string; stack: string };

export const stashError = async (e: unknown) => {
  try {
    const err = e as { message?: string; stack?: string } | null;
    const record: CrashRecord = {
      at: new Date().toISOString(),
      message: err?.message ?? String(e),
      stack: err?.stack ?? '',
    };
    await AsyncStorage.setItem(CRASH_KEY, JSON.stringify(record));
  } catch {
    // best-effort
  }
};

export const readError = async (): Promise<CrashRecord | null> => {
  try {
    const raw = await AsyncStorage.getItem(CRASH_KEY);
    return raw ? (JSON.parse(raw) as CrashRecord) : null;
  } catch {
    return null;
  }
};

export const clearError = async () => {
  try {
    await AsyncStorage.removeItem(CRASH_KEY);
  } catch {
    // best-effort
  }
};