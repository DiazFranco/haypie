import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_KEY = 'hay-pie-truco:tutorial';

export async function hasSeenTutorial(): Promise<boolean> {
  return (await AsyncStorage.getItem(TUTORIAL_KEY)) === 'done';
}

export async function markTutorialSeen(): Promise<void> {
  await AsyncStorage.setItem(TUTORIAL_KEY, 'done');
}