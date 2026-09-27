import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { stashError } from '@/lib/reportError';

type ErrorHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsGlobal = {
  getGlobalHandler(): ErrorHandler;
  setGlobalHandler(handler: ErrorHandler): void;
};

const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsGlobal }).ErrorUtils;

if (!__DEV__ && errorUtils) {
  const originalHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    void stashError(error);
    originalHandler(error, isFatal);
  });
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1B1B1F' },
        }}
      />
    </>
  );
}