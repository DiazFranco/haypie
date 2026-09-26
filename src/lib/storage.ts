import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mesa, Match } from '@/types/database';

const MESAS_KEY = 'hay-pie-truco:mesas';
const matchesKey = (mesaId: string) => `hay-pie-truco:matches:${mesaId}`;

export const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export async function getMesas(): Promise<Mesa[]> {
  const raw = await AsyncStorage.getItem(MESAS_KEY);
  return raw ? (JSON.parse(raw) as Mesa[]) : [];
}

export async function getMesa(id: string): Promise<Mesa | null> {
  const mesas = await getMesas();
  return mesas.find((m) => m.id === id) ?? null;
}

export async function saveMesa(mesa: Mesa): Promise<void> {
  const mesas = await getMesas();
  const index = mesas.findIndex((m) => m.id === mesa.id);
  if (index >= 0) mesas[index] = mesa;
  else mesas.push(mesa);
  await AsyncStorage.setItem(MESAS_KEY, JSON.stringify(mesas));
}

export async function getMatches(mesaId: string): Promise<Match[]> {
  const raw = await AsyncStorage.getItem(matchesKey(mesaId));
  return raw ? (JSON.parse(raw) as Match[]) : [];
}

export async function saveMatch(mesaId: string, match: Match): Promise<void> {
  const matches = await getMatches(mesaId);
  matches.push(match);
  await AsyncStorage.setItem(matchesKey(mesaId), JSON.stringify(matches));
}