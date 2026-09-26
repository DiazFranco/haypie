import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const hasRealCredentials = (url: string, key: string) =>
  Boolean(url) &&
  Boolean(key) &&
  !url.includes('tuproyecto') &&
  !url.includes('tu-anon') &&
  url.startsWith('https://') &&
  /\.supabase\.co/.test(url);

export const isSupabaseConfigured = hasRealCredentials(supabaseUrl, supabaseAnonKey);

const makeClient = (headers: Record<string, string>): SupabaseClient =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: { headers },
  });

// Cliente base: sin header de PIN (solo para canales Realtime / broadcast).
export const supabase = makeClient({});

const clientCache = new Map<string, SupabaseClient>();

// Cliente por mesa: envía `request.pin` como GUC, necesario para el RLS.
export const clientForPin = (pin: string): SupabaseClient => {
  if (!pin) return supabase;
  let client = clientCache.get(pin);
  if (!client) {
    client = makeClient({ 'request.pin': pin });
    clientCache.set(pin, client);
  }
  return client;
};