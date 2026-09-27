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

// Los clientes se crean bajo demanda y solo con credenciales reales: `createClient('')`
// tira "supabaseUrl is required." y, si eso pasa al(require) de una ruta, en release es
// un error fatal durante el render que cierra la app.
let baseClient: SupabaseClient | null = null;

// Cliente base: sin header de PIN (solo lecturas públicas / canales Realtime).
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!baseClient) {
    baseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: { headers: {} },
    });
  }
  return baseClient;
}

const clientCache = new Map<string, SupabaseClient>();

// Cliente por mesa: envía `request.pin` como GUC, necesario para el RLS.
export function clientForPin(pin: string): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!pin) return getSupabase();
  let client = clientCache.get(pin);
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: { headers: { 'request.pin': pin } },
    });
    clientCache.set(pin, client);
  }
  return client;
}